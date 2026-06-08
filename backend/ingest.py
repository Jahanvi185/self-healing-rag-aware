"""
Document Ingestion  —  Self-Healing RAG
Supports: Wikipedia, PDF, plain text, web URL, directory
"""
import argparse, glob, os
from pathlib import Path
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, WebBaseLoader, WikipediaLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

PERSIST_DIR = "./chroma_db"
COLLECTION  = "self_healing_rag"

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

def get_vs():
    return Chroma(persist_directory=PERSIST_DIR,
                  embedding_function=embeddings,
                  collection_name=COLLECTION)

def ingest(docs, label=""):
    chunks = splitter.split_documents(docs)
    print(f"  → {len(chunks)} chunks from '{label}'")
    get_vs().add_documents(chunks)
    print(f"  ✓ Done")

def ingest_pdf(path):
    print(f"[PDF] {path}")
    ingest(PyPDFLoader(path).load(), Path(path).name)

def ingest_text(path):
    print(f"[TXT] {path}")
    ingest(TextLoader(path, encoding="utf-8").load(), Path(path).name)

def ingest_url(url):
    print(f"[URL] {url}")
    ingest(WebBaseLoader(url).load(), url)

def ingest_wikipedia(topic):
    print(f"[WIKI] {topic}")
    ingest(WikipediaLoader(query=topic, load_max_docs=3).load(), f"wikipedia:{topic}")

def ingest_directory(d):
    for f in glob.glob(os.path.join(d, "**/*.pdf"), recursive=True): ingest_pdf(f)
    for f in glob.glob(os.path.join(d, "**/*.txt"), recursive=True): ingest_text(f)

def load_demo():
    topics = [
        "Retrieval-Augmented Generation",
        "Large language model",
        "LangChain software",
        "Vector database",
        "Transformer deep learning architecture",
        "Hallucination artificial intelligence",
        "Prompt engineering",
        "Llama language model",
    ]
    print("\n📚 Loading demo knowledge base from Wikipedia...\n")
    for t in topics:
        try: ingest_wikipedia(t)
        except Exception as e: print(f"  ⚠ '{t}': {e}")
    print("\n✅ Done. Start the API server now.\n")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pdf");  p.add_argument("--txt")
    p.add_argument("--url");  p.add_argument("--wiki")
    p.add_argument("--dir");  p.add_argument("--demo", action="store_true")
    a = p.parse_args()
    if   a.pdf:  ingest_pdf(a.pdf)
    elif a.txt:  ingest_text(a.txt)
    elif a.url:  ingest_url(a.url)
    elif a.wiki: ingest_wikipedia(a.wiki)
    elif a.dir:  ingest_directory(a.dir)
    else:        load_demo()
