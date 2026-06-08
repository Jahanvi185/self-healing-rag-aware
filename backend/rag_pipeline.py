"""
Self-Healing RAG Pipeline  —  100% FREE (Groq + HuggingFace Embeddings)
"""

import os
import json
import re
from typing import TypedDict, List, Optional, Literal
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()
memory = MemorySaver()
# ── Models ─────────────────────────────────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.environ.get("GROQ_API_KEY"),
)

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

# ── State ──────────────────────────────────────────────────────────────────────
class RAGState(TypedDict):
    question: str
    retrieved_docs: List[Document]
    generated_answer: str
    critique_result: str
    critique_reason: str
    reformulated_query: Optional[str]
    retry_count: int
    final_answer: str

# ── Vector Store ───────────────────────────────────────────────────────────────
PERSIST_DIR = "./chroma_db"
_vs_instance = None

def get_vectorstore() -> Chroma:
    global _vs_instance
    if _vs_instance is None:
        _vs_instance = Chroma(
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings,
            collection_name="self_healing_rag",
        )
    return _vs_instance

def ingest_documents(texts: List[str], metadatas: List[dict] = None):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    metadatas = metadatas or [{"source": "manual"} for _ in texts]
    docs = splitter.create_documents(texts, metadatas=metadatas)
    get_vectorstore().add_documents(docs)
    return len(docs)

# ── Nodes ──────────────────────────────────────────────────────────────────────
def retrieve(state: RAGState) -> RAGState:
    query = state.get("reformulated_query") or state["question"]
    docs = get_vectorstore().as_retriever(search_kwargs={"k": 3}).invoke(query)
    return {**state, "retrieved_docs": docs}

def generate(state: RAGState) -> RAGState:
    context = "\n\n".join(d.page_content for d in state["retrieved_docs"])
    prompt = ChatPromptTemplate.from_template(
        "You are a helpful assistant. Use this context to answer: {question}\n\n"
        "Context: {context}\n\n"
        "If unsure, say 'I don't have enough information to answer this confidently.'"
    )
    answer = (prompt | llm | StrOutputParser()).invoke({"context": context, "question": state["question"]})
    return {**state, "generated_answer": answer}

def critique(state: RAGState) -> RAGState:
    ans = state["generated_answer"].lower()
    if "don't have enough" in ans or "insufficient" in ans:
        return {**state, "critique_result": "pass", "critique_reason": "Safe fallback."}

    prompt = ChatPromptTemplate.from_template(
        "Evaluate the following answer based on the context.\n"
        "Context: {context}\nAnswer: {answer}\n"
        "Output ONLY valid JSON like this: {{\"result\": \"pass\", \"reason\": \"grounded\"}} or {{\"result\": \"fail\", \"reason\": \"hallucinated\"}}"
    )
    
    try:
        raw = (prompt | llm | StrOutputParser()).invoke({
            "context": state["retrieved_docs"], "answer": state["generated_answer"]
        })
        # Extract JSON using Regex
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        parsed = json.loads(match.group(0))
        return {**state, "critique_result": parsed["result"], "critique_reason": parsed["reason"]}
    except:
        return {**state, "critique_result": "fail", "critique_reason": "JSON parse error"}

def reformulate(state: RAGState) -> RAGState:
    prompt = ChatPromptTemplate.from_template("Rewrite this for better search: {question}")
    new_q = (prompt | llm | StrOutputParser()).invoke({"question": state["question"]})
    return {**state, "reformulated_query": new_q.strip(), "retry_count": state.get("retry_count", 0) + 1}

def finalize(state: RAGState) -> RAGState:
    if state["critique_result"] == "pass":
        final = state["generated_answer"]
    else:
        final = "I don't have enough reliable information to answer this accurately."
    return {**state, "final_answer": final}

# ── Graph ──────────────────────────────────────────────────────────────────────
def build_graph():
    g = StateGraph(RAGState)
    g.add_node("retrieve", retrieve)
    g.add_node("generate", generate)
    g.add_node("critique", critique)
    g.add_node("reformulate", reformulate)
    g.add_node("finalize", finalize)
    g.set_entry_point("retrieve")
    g.add_edge("retrieve", "generate")
    g.add_edge("generate", "critique")
    g.add_conditional_edges("critique", lambda s: "finalize" if s["critique_result"] == "pass" or s.get("retry_count", 0) >= 2 else "reformulate")
    g.add_edge("reformulate", "retrieve")
    g.add_edge("finalize", END)
    return g.compile()

pipeline = build_graph()

def ask(question: str) -> dict:
    r = pipeline.invoke({"question": question, "retrieved_docs": [], "generated_answer": "", "critique_result": "", "critique_reason": "", "reformulated_query": None, "retry_count": 0, "final_answer": ""})
    return {"question": r["question"], "answer": r["final_answer"], "critique_result": r["critique_result"], "sources": [{"content": d.page_content[:200]} for d in r["retrieved_docs"]]}
