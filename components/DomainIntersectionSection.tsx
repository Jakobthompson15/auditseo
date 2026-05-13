"use client";

import type { IntersectionKeyword } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  keywords: IntersectionKeyword[];
  competitor: string;
}

function PosDiff({ ours, theirs }: { ours: number; theirs: number }) {
  const diff = ours - theirs;
  if (diff <= 0) return <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--seo)" }}>+{Math.abs(diff)}</span>;
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--error)" }}>−{diff}</span>;
}

export default function DomainIntersectionSection({ keywords, competitor }: Props) {
  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--text-dim)" }} />
        <span className="section-title">Keyword Gaps</span>
        {competitor && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", background: "var(--card-hover)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
            vs {competitor}
          </span>
        )}
      </div>

      {keywords.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No keyword overlap found with top competitor.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Keyword", "Volume", "Our Pos", "Their Pos", "Gap", "CPC"].map(h => (
                    <th key={h} style={{
                      textAlign: h === "Keyword" ? "left" : "right",
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
                {keywords.map((kw, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {kw.keyword}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)", fontSize: "0.68rem" }}>
                      {fmt(kw.search_volume)}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)" }}>
                      {kw.our_position || "—"}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)" }}>
                      {kw.competitor_position || "—"}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>
                      {kw.our_position && kw.competitor_position
                        ? <PosDiff ours={kw.our_position} theirs={kw.competitor_position} />
                        : <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "0.5rem 0 0.5rem 0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      ${kw.cpc.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
            Keywords where both domains rank. Gap = position difference (green = you rank higher).
          </p>
        </>
      )}
    </div>
  );
}
