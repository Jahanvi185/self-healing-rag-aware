import { useState } from "react";

const TABS = [
  { key: "wiki", icon: "📖", label: "Wikipedia",  field: "Topic",   placeholder: "e.g. Retrieval-Augmented Generation", hint: "Loads up to 3 related Wikipedia articles automatically." },
  { key: "url",  icon: "🌐", label: "Web URL",    field: "URL",     placeholder: "https://example.com/article", hint: "Scrapes and indexes the full page content." },
  { key: "text", icon: "📝", label: "Raw Text",   field: "Content", placeholder: "Paste your document content here…", textarea: true, hint: "Paste any text directly — research notes, docs, articles." },
];

const DEMO_TOPICS = [
  "Retrieval-Augmented Generation", "Large language model",
  "LangChain software", "Vector database",
  "Transformer deep learning architecture", "Prompt engineering",
  "Hallucination artificial intelligence", "Llama language model",
];

export default function IngestPanel({ api, onIngest }) {
  const [tab, setTab]       = useState("wiki");
  const [value, setValue]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [demoLoad, setDemo] = useState(false);
  const [msg, setMsg]       = useState(null); 

  const cfg = TABS.find(t => t.key === tab);

  async function post(endpoint, body) {
    const res  = await fetch(`${api}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error");
    return data;
  }

  async function handleIngest() {
    if (!value.trim()) return;
    setLoad(true); setMsg(null);
    try {
      const bodies = { wiki: { topic: value }, url: { url: value }, text: { text: value } };
      const endpoints = { wiki: "/ingest/wiki", url: "/ingest/url", text: "/ingest/text" };
      const data = await post(endpoints[tab], bodies[tab]);
      setMsg({ text: data.message, type: "success" });
      setValue(""); onIngest?.();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
    finally { setLoad(false); }
  }

  async function loadDemo() {
    setDemo(true); setMsg(null);
    let done = 0;
    for (const topic of DEMO_TOPICS) {
      try {
        await post("/ingest/wiki", { topic });
        done++;
        setMsg({ text: `Ingested ${done}/${DEMO_TOPICS.length}: ${topic}`, type: "success" });
      } catch {
        setMsg({ text: `Skipped: ${topic}`, type: "error" });
      }
    }
    setMsg({ text: `✓ Demo loaded! ${done} Wikipedia articles ingested into ChromaDB.`, type: "success" });
    setDemo(false); onIngest?.();
  }

  return (
    <div>
      {/* Quick-load demo */}
      <div className="card" style={{ background: "linear-gradient(135deg,rgba(79,255,176,0.04),rgba(56,189,248,0.03))", border:"1px solid rgba(79,255,176,0.15)" }}>
        <div className="card-title"> Quick Start — Load Demo Knowledge Base</div>
        <div className="card-sub">
          Loads 8 Wikipedia articles on RAG, LLMs, Transformers, Prompt Engineering and more.
          Perfect for testing right away.
        </div>
        <button className="btn-ingest" onClick={loadDemo} disabled={demoLoad || loading}
          style={{ background:"rgba(79,255,176,0.08)", borderColor:"rgba(79,255,176,0.3)", color:"var(--accent)" }}>
          {demoLoad
            ? <><span className="spinner" style={{ borderTopColor:"var(--accent)" }} /> Loading demo articles…</>
            : " Load Demo Knowledge Base (8 Wikipedia Articles)"}
        </button>
      </div>

      {/* Manual ingest */}
      <div className="card">
        <div className="card-title">Add Custom Documents</div>
        <div className="card-sub">Ingest your own content — research papers, articles, documentation, notes.</div>

        <div className="ingest-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`ingest-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => { setTab(t.key); setValue(""); setMsg(null); }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <label className="field-label">{cfg.field}</label>
        {cfg.textarea ? (
          <textarea
            className="field-textarea"
            placeholder={cfg.placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        ) : (
          <input
            className="field-input"
            type="text"
            placeholder={cfg.placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIngest()}
          />
        )}

        <button className="btn-ingest" onClick={handleIngest} disabled={loading || !value.trim()}>
          {loading
            ? <><span className="spinner" /> Ingesting…</>
            : `📥 Ingest ${cfg.label}`}
        </button>

        {msg && (
          <div className={`alert alert-${msg.type}`}>{msg.text}</div>
        )}

        <div className="ingest-tips" style={{ marginTop: "1.25rem" }}>
          <h3>Tips & CLI Commands</h3>
          <ul>
            <li>{cfg.hint}</li>
            <li>For PDFs: <code>python ingest.py --pdf your_file.pdf</code></li>
            <li>Whole folder: <code>python ingest.py --dir ./my_docs/</code></li>
            <li>All data stored locally in <code>./backend/chroma_db/</code></li>
            <li>Embeddings run locally for free via HuggingFace (no API key needed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
