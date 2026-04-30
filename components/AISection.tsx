"use client";

import type { AIMetrics, AIKeywordItem } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface AISectionProps {
  metrics: AIMetrics;
  aiKeywords: AIKeywordItem[];
}

interface StatCellProps {
  label: string;
  value: string;
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <div className="stat-cell">
      <span className="label">{label}</span>
      <span className="value-md" style={{ color: "var(--ai)" }}>
        {value}
      </span>
    </div>
  );
}

export default function AISection({ metrics, aiKeywords }: AISectionProps) {
  const maxCount = Math.max(...aiKeywords.map((k) => k.total_count), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--ai)" }} />
        <span className="section-title" style={{ color: "var(--ai)" }}>
          AI / LLM Visibility
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            background: "rgba(180,106,247,0.1)",
            border: "1px solid rgba(180,106,247,0.2)",
            borderRadius: 4,
            padding: "2px 7px",
          }}
        >
          AI Tools
        </span>
      </div>

      {/* Stat grid */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCell label="Total Mentions" value={fmt(metrics.total_mentions)} />
        <StatCell label="AI Search Vol." value={fmt(metrics.ai_search_volume)} />
        <StatCell label="In Answers" value={fmt(metrics.answer_mentions)} />
        <StatCell label="In Questions" value={fmt(metrics.question_mentions)} />
      </div>

      {/* AI keyword cards */}
      {aiKeywords.length > 0 && (
        <>
          <p className="label" style={{ marginBottom: "0.875rem" }}>
            Top AI Mention Queries
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {aiKeywords.map((kw, i) => (
              <div
                key={`${kw.keyword}-${i}`}
                className="card-sm"
                style={{
                  background: "rgba(180,106,247,0.06)",
                  border: "1px solid rgba(180,106,247,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 1rem",
                }}
              >
                {/* Index */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    width: 18,
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  {i + 1}
                </span>

                {/* Keyword */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    color: "var(--text)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {kw.keyword || "—"}
                </span>

                {/* Mini bar + count */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 3,
                    flexShrink: 0,
                    minWidth: 80,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      color: "var(--ai)",
                    }}
                  >
                    {fmt(kw.total_count)} mentions
                  </span>
                  <div className="vol-track" style={{ width: 80 }}>
                    <div
                      className="vol-fill-ai"
                      style={{
                        width: `${Math.round((kw.total_count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* AI vol */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                >
                  {fmt(kw.ai_search_volume)} vol
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {aiKeywords.length === 0 && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          No AI mention query data available.
        </p>
      )}
    </div>
  );
}
