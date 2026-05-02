"use client";

import { fmt } from "@/lib/audit";
import type { CompetitorItem, RankData, BacklinkData } from "@/lib/types";

interface CompetitorSectionProps {
  competitors: CompetitorItem[];
  auditedDomain: string;
  auditedRank: RankData;
  auditedBacklinks: BacklinkData;
}

function DomainAuthorityBar({ rank, color }: { rank: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div className="gauge-track" style={{ flex: 1, marginTop: 0 }}>
        <div
          className="gauge-fill"
          style={{ width: `${rank}%`, background: color }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color,
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {rank}
      </span>
    </div>
  );
}

function Delta({ value, better }: { value: number; better: "higher" | "lower" }) {
  if (value === 0) return <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>—</span>;
  const isGood = better === "higher" ? value > 0 : value < 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        color: isGood ? "var(--seo)" : "var(--error)",
      }}
    >
      {sign}{fmt(Math.abs(value))}
    </span>
  );
}

export default function CompetitorSection({
  competitors,
  auditedDomain,
  auditedRank,
  auditedBacklinks,
}: CompetitorSectionProps) {
  if (competitors.length === 0) return null;

  const rows = [
    {
      domain: auditedDomain,
      organic_count: auditedRank.organic_count,
      organic_etv: auditedRank.organic_etv,
      rank: auditedBacklinks.rank,
      isAudited: true,
    },
    ...competitors.map((c) => ({ ...c, isAudited: false })),
  ];

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--error)" }} />
        <span className="section-title" style={{ color: "var(--error)" }}>
          Industry Leaders
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
          }}
        >
          How You Compare
        </span>
      </div>

      <div style={{ overflowX: "auto" }} className="keyword-scroll">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
          }}
        >
          <thead>
            <tr>
              {["Domain", "Domain Authority", "Organic Keywords", "Est. Traffic Value"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    color: "var(--text-muted)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const daColor = row.rank >= 60 ? "var(--error)" : row.rank >= 35 ? "var(--purple)" : "var(--text-muted)";
              const isFirst = i === 0;
              return (
                <tr
                  key={row.domain}
                  style={{
                    background: row.isAudited ? "rgba(124,106,247,0.06)" : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {row.isAudited && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            color: "var(--purple)",
                            background: "var(--purple-dim)",
                            border: "1px solid rgba(124,106,247,0.3)",
                            borderRadius: 4,
                            padding: "1px 5px",
                            flexShrink: 0,
                          }}
                        >
                          YOU
                        </span>
                      )}
                      <span style={{ color: row.isAudited ? "var(--text)" : "var(--text-dim)" }}>
                        {row.domain}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem", minWidth: 160 }}>
                    <DomainAuthorityBar rank={row.rank} color={daColor} />
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--text)" }}>{fmt(row.organic_count)}</span>
                      {!isFirst && (
                        <Delta
                          value={row.organic_count - auditedRank.organic_count}
                          better="higher"
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--text)" }}>${fmt(row.organic_etv)}</span>
                      {!isFirst && (
                        <Delta
                          value={row.organic_etv - auditedRank.organic_etv}
                          better="higher"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
