import { useState } from "react";

const EXAMPLES = [
  "What is Retrieval-Augmented Generation?",
  "How does the Transformer attention mechanism work?",
  "What is prompt engineering and why does it matter?",
  "How do vector databases enable semantic search?",
  "What are the key differences between GPT and Llama models?",
  "How does LangGraph handle cyclical stateful workflows?",
];

export default function QueryPanel({ onAsk, loading }) {
  const [q, setQ] = useState("");

  function submit(question) {
    const val = (question || q).trim();
    if (val) { setQ(val); onAsk(val); }
  }

  return (
    <div className="card">
      <div className="card-title">Ask your knowledge base</div>
      <div className="card-sub">
        The pipeline will retrieve, generate, critique, and self-correct if hallucination is detected.
      </div>

      <div className="query-wrap">
        <textarea
          className="query-textarea"
          placeholder="Ask anything about your ingested documents…"
          value={q}
          onChange={e => setQ(e.target.value)}
          rows={4}
          disabled={loading}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <div className="query-actions">
          <span className="char-count">{q.length} chars · ⌘↵ to run</span>
          <button className="btn-run" onClick={() => submit()} disabled={loading || !q.trim()}>
            {loading
              ? <><span className="spinner" /> Running…</>
              : <>Run Pipeline →</>}
          </button>
        </div>
      </div>

      <div className="examples-row">
        <p className="examples-label">Try an example question:</p>
        <div className="chips">
          {EXAMPLES.map(ex => (
            <button key={ex} className="chip" onClick={() => submit(ex)} disabled={loading}>
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
