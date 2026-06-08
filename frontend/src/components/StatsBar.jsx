import { useEffect, useState } from "react";

export default function StatsBar({ api }) {
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    fetch(`${api}/stats`)
      .then((r) => r.json())
      .then((d) => setDocs(d.documents_in_store))
      .catch(() => setDocs("—"));
  }, [api]);

  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-value">{docs ?? "…"}</span>
        <span className="stat-label">Chunks Indexed</span>
      </div>
      <div className="stat">
        <span className="stat-value">GPT-4o</span>
        <span className="stat-label">LLM</span>
      </div>
      <div className="stat">
        <span className="stat-value">Chroma</span>
        <span className="stat-label">Vector Store</span>
      </div>
    </div>
  );
}
