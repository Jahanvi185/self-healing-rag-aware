import { useState } from "react";

function Step({ num, label, status, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className={`step step-${status}`}>
      <button className="step-header" onClick={() => setOpen(o => !o)}>
        <span className="step-num">{num}</span>
        <span className="step-label">{label}</span>
        {status === "pass"    && <span className="badge badge-pass">✓ Pass</span>}
        {status === "fail"    && <span className="badge badge-fail">✗ Fail</span>}
        {status === "retry"   && <span className="badge badge-retry">↻ Retried</span>}
        {status === "info"    && <span className="badge badge-info">•</span>}
        {status === "neutral" && <span className="badge badge-neutral">•</span>}
        <span className={`step-chevron ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && <div className="step-body">{children}</div>}
    </div>
  );
}

export default function PipelineTrace({ result }) {
  const passed    = result.critique_result === "pass";
  const retried   = result.retry_count > 0;
  const latency   = result.latency_ms;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* ── Final Answer ── */}
      <div className="answer-card">
        <div className="answer-header">
          <span className="answer-title">Final Answer</span>
          <div className="answer-meta">
            <span className={`badge ${passed ? "badge-pass" : "badge-fail"}`}>
              {passed ? "✓ Grounded" : "⚠ Insufficient Info"}
            </span>
            {retried && (
              <span className="badge badge-retry">↻ {result.retry_count} Retry</span>
            )}
            <span className="badge badge-neutral">{latency} ms</span>
          </div>
        </div>
        <p className="answer-text">{result.answer}</p>
      </div>

      {/* ── Pipeline Steps ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          Pipeline Trace
          <span className="badge badge-neutral" style={{ marginLeft: "0.6rem", fontSize: "0.68rem" }}>
            {retried ? `${3 + result.retry_count} nodes executed` : "3 nodes executed"}
          </span>
        </div>

        <div className="steps">
          {/* Step 1: Retrieve */}
          <Step num="1" label="Retrieve" status="info">
            <p className="step-desc">
              Retrieved <strong style={{ color: "var(--accent2)" }}>{result.sources.length} chunks</strong> from ChromaDB using semantic similarity search.
              {result.reformulated_query && (
                <> Final query used: <em>"{result.reformulated_query}"</em></>
              )}
            </p>
            <div className="sources">
              {result.sources.map((s, i) => (
                <div key={i} className="source-chunk">
                  <span className="source-tag">CHUNK {i + 1}</span>
                  <p className="source-text">{s.content}…</p>
                  {s.metadata?.source && (
                    <span className="source-meta">📄 {s.metadata.source}</span>
                  )}
                </div>
              ))}
              {result.sources.length === 0 && (
                <p className="source-text" style={{ color: "var(--danger)", fontStyle: "italic" }}>
                  No relevant chunks found in the knowledge base.
                </p>
              )}
            </div>
          </Step>

          {/* Step 2: Generate */}
          <Step num="2" label="Generate" status="info">
            <p className="step-desc">
              Llama 3.3 70B (via Groq) generated an answer grounded strictly in the retrieved context.
              The model was instructed to say "I don't have enough information" rather than hallucinate.
            </p>
          </Step>

          {/* Step 3: Critique */}
          <Step num="3" label="Critique Agent" status={passed ? "pass" : retried ? "retry" : "fail"} defaultOpen>
            <p className="step-desc">
              A second LLM call acts as a critic — checking if every claim in the answer
              is directly supported by the retrieved context.
            </p>
            <div className={`critique-box ${passed ? "pass" : "fail"}`}>
              <span className="critique-icon">{passed ? "✅" : "❌"}</span>
              <p className="critique-reason">{result.critique_reason}</p>
            </div>
          </Step>

          {/* Step 4: Reformulate (conditional) */}
          {retried && (
            <Step num="4" label="Query Reformulation" status="retry" defaultOpen>
              <p className="step-desc">
                The original query didn't retrieve sufficient context.
                A new query was generated with different keywords and tried again.
              </p>
              <div className="reformulated-box">"{result.reformulated_query}"</div>
            </Step>
          )}

          {/* Step Final: Finalize */}
          <Step num={retried ? "5" : "4"} label="Finalize" status={passed ? "pass" : "fail"}>
            <p className="step-desc">
              {passed
                ? "The answer passed the critic check. Returned as the final grounded response."
                : `After ${result.retry_count} retry attempt(s), the pipeline could not ground the answer. A safe fallback was returned instead of a hallucinated response.`}
            </p>
          </Step>
        </div>
      </div>
    </div>
  );
}
