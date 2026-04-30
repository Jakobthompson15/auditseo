"use client";

import type { KeywordItem } from "@/lib/types";
import { fmt, fmtCpc } from "@/lib/audit";

interface KeywordsTableProps {
  keywords: KeywordItem[];
}

function rankBadgeClass(rank: number): string {
  if (rank <= 3) return "rank-badge rank-top";
  if (rank <= 10) return "rank-badge rank-mid";
  return "rank-badge rank-low";
}

export default function KeywordsTable({ keywords }: KeywordsTableProps) {
  if (keywords.length === 0) {
    return (
      <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
        <div className="section-header">
          <span className="section-dot" style={{ background: "var(--seo)" }} />
          <span className="section-title" style={{ color: "var(--seo)" }}>
            Top Keywords
          </span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          No keyword data available.
        </p>
      </div>
    );
  }

  const maxVol = Math.max(...keywords.map((k) => k.search_volume), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--seo)" }} />
        <span className="section-title" style={{ color: "var(--seo)" }}>
          Top Keywords
        </span>
      </div>

      <div className="keyword-scroll">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 480,
          }}
          aria-label="Top ranked keywords"
        >
          <thead>
            <tr>
              {["Keyword", "Rank", "Search Volume", "CPC"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    paddingBottom: "0.75rem",
                    fontWeight: 400,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, i) => (
              <tr
                key={`${kw.keyword}-${i}`}
                style={{
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}
              >
                {/* Keyword */}
                <td
                  style={{
                    padding: "0.75rem 0",
                    paddingRight: "1rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    color: "var(--text)",
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {kw.keyword || "—"}
                </td>

                {/* Rank badge */}
                <td style={{ padding: "0.75rem 0", paddingRight: "1rem" }}>
                  <span className={rankBadgeClass(kw.rank)}>
                    {kw.rank > 0 ? `#${kw.rank}` : "—"}
                  </span>
                </td>

                {/* Search volume with bar */}
                <td style={{ padding: "0.75rem 0", paddingRight: "1rem", minWidth: 140 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        color: "var(--text)",
                      }}
                    >
                      {fmt(kw.search_volume)}
                    </span>
                    <div className="vol-track" style={{ width: 100 }}>
                      <div
                        className="vol-fill-seo"
                        style={{
                          width: `${Math.round((kw.search_volume / maxVol) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>

                {/* CPC */}
                <td
                  style={{
                    padding: "0.75rem 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-dim)",
                  }}
                >
                  {kw.cpc > 0 ? fmtCpc(kw.cpc) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
