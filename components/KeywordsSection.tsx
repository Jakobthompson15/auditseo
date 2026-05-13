"use client";

import type { KeywordOpportunity } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  keywords: KeywordOpportunity[];
}

function DiffBadge({ value }: { value: number }) {
  const color = value <= 30 ? "var(--seo)" : value <= 60 ? "var(--ai)" : "var(--error)";
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
    }}>{value}</span>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const map: Record<string, string> = {
    commercial: "var(--purple)",
    transactional: "var(--seo)",
    informational: "var(--text-muted)",
    navigational: "var(--text-dim)",
  };
  const color = map[intent] ?? "var(--text-muted)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.65rem",
      color,
      opacity: 0.9,
    }}>{intent}</span>
  );
}

export default function KeywordsSection({ keywords }: Props) {
  const maxScore = Math.max(...keywords.map(k => k.opportunity_score), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>Keyword Opportunities</span>
      </div>

      {keywords.length === 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No keyword data returned for this domain.
        </p>
      )}

      {keywords.length > 0 && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Keyword", "Volume", "Diff", "CPC", "Intent", "Pos", "Opportunity"].map(h => (
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
            {keywords.map((kw, i) => {
              const barPct = Math.round((kw.opportunity_score / maxScore) * 100);
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.04))" }}>
                  <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {kw.keyword}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                    {fmt(kw.search_volume)}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    <DiffBadge value={kw.keyword_difficulty} />
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                    ${kw.cpc.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    <IntentBadge intent={kw.intent} />
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right", fontFamily: "var(--font-mono)", color: kw.rank_position !== undefined && kw.rank_position >= 11 && kw.rank_position <= 20 ? "var(--seo)" : "var(--text-dim)" }}>
                    {kw.rank_position ?? "—"}
                  </td>
                  <td style={{ padding: "0.5rem 0 0.5rem 0.5rem", minWidth: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end" }}>
                      <div style={{ width: 64, height: 4, borderRadius: 9999, background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ width: `${barPct}%`, height: "100%", borderRadius: 9999, background: "var(--purple)", transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {keywords.length > 0 && (
        <p style={{ marginTop: "0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Diff = keyword difficulty (0–100). Pos = current ranking position. Positions 11–20 are highlighted as quick-win opportunities.
        </p>
      )}
    </div>
  );
}
