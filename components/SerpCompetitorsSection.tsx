"use client";

import type { SerpCompetitor } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  competitors: SerpCompetitor[];
}

export default function SerpCompetitorsSection({ competitors }: Props) {
  const maxKw = Math.max(...competitors.map(c => c.keywords_count), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--ai)" }} />
        <span className="section-title" style={{ color: "var(--ai)" }}>Organic Competitors</span>
      </div>

      {competitors.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No competitors found.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Competitor", "Avg Position", "Shared Keywords", "Traffic Value"].map(h => (
                    <th key={h} style={{
                      textAlign: h === "Competitor" ? "left" : "right",
                      padding: "0 0.5rem 0.625rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => {
                  const barPct = Math.round((c.keywords_count / maxKw) * 100);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.domain}
                      </td>
                      <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                        {c.avg_position.toFixed(1)}
                      </td>
                      <td style={{ padding: "0.5rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                          <div style={{ width: 48, height: 4, borderRadius: 9999, background: "var(--border)", overflow: "hidden" }}>
                            <div style={{ width: `${barPct}%`, height: "100%", background: "var(--ai)", borderRadius: 9999 }} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)" }}>
                            {fmt(c.keywords_count)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.5rem 0 0.5rem 0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.68rem" }}>
                        ${fmt(c.etv)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
            Domains competing for the same keywords. Shared keywords = overlap with your domain.
          </p>
        </>
      )}
    </div>
  );
}
