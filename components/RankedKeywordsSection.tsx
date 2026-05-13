"use client";

import type { RankedKeyword } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  keywords: RankedKeyword[];
}

function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = {
    commercial: "var(--seo)",
    transactional: "var(--purple)",
    informational: "var(--text-muted)",
    navigational: "var(--text-dim)",
  };
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: colors[intent] ?? "var(--text-muted)" }}>
      {intent}
    </span>
  );
}

function PosBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? "var(--seo)" : pos <= 10 ? "var(--ai)" : "var(--text-muted)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.68rem",
      fontWeight: 600,
      color,
      background: `${color}22`,
      border: `1px solid ${color}44`,
      borderRadius: 4,
      padding: "1px 6px",
    }}>{pos}</span>
  );
}

export default function RankedKeywordsSection({ keywords }: Props) {
  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--seo)" }} />
        <span className="section-title" style={{ color: "var(--seo)" }}>Ranking Keywords</span>
      </div>

      {keywords.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No ranking data found for this domain.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Keyword", "Position", "Volume", "CPC", "Intent"].map(h => (
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
                    <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {kw.keyword}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>
                      <PosBadge pos={kw.rank_position} />
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                      {fmt(kw.search_volume)}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                      ${kw.cpc.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.5rem 0 0.5rem 0.5rem", textAlign: "right" }}>
                      <IntentBadge intent={kw.intent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
            Sorted by search volume. Green = top 3, blue = top 10.
          </p>
        </>
      )}
    </div>
  );
}
