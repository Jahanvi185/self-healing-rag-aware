"""
FastAPI Backend — Self-Healing RAG (Free: Groq + HuggingFace Embeddings)
"""
import os, time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from rag_pipeline import ask, get_vectorstore, ingest_documents
from ingest import ingest_wikipedia, ingest_url as _ingest_url

app = FastAPI(title="Self-Healing RAG API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AskReq(BaseModel):
    question: str

class WikiReq(BaseModel):
    topic: str

class URLReq(BaseModel):
    url: str

class TextReq(BaseModel):
    text: str
    metadata: Optional[dict] = {}

@app.get("/health")
def health():
    return {"status": "ok", "model": "llama-3.3-70b-versatile (Groq Free)", "embeddings": "BAAI/bge-small-en-v1.5 (local free)"}

@app.get("/stats")
def stats():
    try:
        vs    = get_vectorstore()
        count = vs._collection.count()
        return {"documents_in_store": count}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/ask")
def ask_question(req: AskReq):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    start  = time.time()
    result = ask(req.question)
    return {**result, "latency_ms": round((time.time() - start) * 1000, 2)}

@app.post("/ingest/wiki")
def ingest_wiki(req: WikiReq):
    try:
        ingest_wikipedia(req.topic)
        return {"status": "success", "message": f"✓ Ingested Wikipedia: \"{req.topic}\""}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/ingest/url")
def ingest_webpage(req: URLReq):
    try:
        _ingest_url(str(req.url))
        return {"status": "success", "message": f"✓ Ingested URL: {req.url}"}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/ingest/text")
def ingest_text(req: TextReq):
    try:
        ingest_documents([req.text], [req.metadata or {}])
        return {"status": "success", "message": "✓ Text ingested successfully."}
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)

