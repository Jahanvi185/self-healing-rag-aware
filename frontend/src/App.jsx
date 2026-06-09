import { useState, useEffect } from "react";
import QueryPanel from "./components/QueryPanel";
import PipelineTrace from "./components/PipelineTrace";
import IngestPanel from "./components/IngestPanel";
import "./index.css";

const API = import.meta.env.VITE_API_URL || "https://jahanvi2005-self-healingrag.hf.space";

export default function App() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState("query");
  const [chunks, setChunks]   = useState(null);

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(d => setChunks(d.documents_in_store)).catch(() => {});
  }, []);

  async function handleAsk(question) {
    setLoading(true); setError(""); setResult(null);
    try {
      const res  = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server error");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">⟳</div>
            <div className="logo-text">
              <h1>Self-Healing RAG</h1>
              <p>LANGGRAPH · GROQ · CHROMADB</p>
            </div>
          </div>
          <div className="header-right">
            <div className="stat-pill">
              <span className="dot" />
              <span className="val">{chunks ?? "…"}</span>
              <span className="lbl">chunks indexed</span>
            </div>
            <div className="model-badge">llama-3.3-70b</div>
            <div className="free-badge">FREE</div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-label">⚡ LangGraph Stateful Pipeline</div>
        <h2>RAG that <span>fixes itself</span><br/>when it hallucinates</h2>
        <p>
          A critic agent evaluates every answer for hallucinations.
          If it fails, the query is reformulated and retried — automatically.
        </p>
        <div className="hero-steps">
          {["Retrieve","Generate","Critique","Reformulate","Finalize"].map((s,i)=>(
            <div className="hero-step" key={s}>
              <span className="num">{i+1}</span>{s}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="main">
        <div className="tabs">
          <button className={`tab ${tab==="query"?"active":""}`} onClick={()=>setTab("query")}>
            <span className="tab-icon">🔍</span> Ask Question
          </button>
          <button className={`tab ${tab==="ingest"?"active":""}`} onClick={()=>setTab("ingest")}>
            <span className="tab-icon">📚</span> Add Knowledge
          </button>
        </div>

        {tab === "query" ? (
          <>
            <QueryPanel onAsk={handleAsk} loading={loading} />
            {error && <div className="alert alert-error">⚠ {error}</div>}
            {loading && <LoadingSkeleton />}
            {result && !loading && <PipelineTrace result={result} />}
          </>
        ) : (
          <IngestPanel api={API} onIngest={() =>
            fetch(`${API}/stats`).then(r=>r.json()).then(d=>setChunks(d.documents_in_store)).catch(()=>{})
          }/>
        )}
      </div>

      <footer className="footer">
        Built with&nbsp;
        <a href="https://python.langchain.com/docs/langgraph" target="_blank">LangGraph</a>
        &nbsp;·&nbsp;
        <a href="https://console.groq.com" target="_blank">Groq (Free)</a>
        &nbsp;·&nbsp;
        <a href="https://www.trychroma.com" target="_blank">ChromaDB</a>
        &nbsp;·&nbsp;
        <a href="https://fastapi.tiangolo.com" target="_blank">FastAPI</a>
        &nbsp;·&nbsp;React — 100% free to run
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="card">
        <div className="skel skel-animate" style={{height:"18px",width:"40%",marginBottom:"1rem"}} />
        <div className="skel skel-animate" style={{height:"14px",width:"100%"}} />
        <div className="skel skel-animate" style={{height:"14px",width:"85%"}} />
        <div className="skel skel-animate" style={{height:"14px",width:"70%",marginBottom:"1rem"}} />
        <div style={{display:"flex",gap:"8px"}}>
          {[1,2,3].map(i=><div key={i} className="skel skel-animate" style={{height:"28px",width:"90px",borderRadius:"999px"}}/>)}
        </div>
      </div>
      <div className="card">
        {[1,2,3,4].map(i=>(
          <div key={i} style={{display:"flex",gap:"10px",alignItems:"center",padding:"0.7rem 0",borderBottom:"1px solid var(--border)"}}>
            <div className="skel skel-animate" style={{width:"24px",height:"24px",borderRadius:"50%",flexShrink:0}} />
            <div style={{flex:1}}>
              <div className="skel skel-animate" style={{height:"13px",width:"30%",marginBottom:"6px"}} />
              <div className="skel skel-animate" style={{height:"11px",width:"60%"}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
