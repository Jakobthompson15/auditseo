"use client";

import type { ContentMention } from "@/lib/types";

interface Props {
  mentions: ContentMention[];
}

function SentimentDot({ sentiment }: { sentiment: ContentMention["sentiment"] }) {
  const color = sentiment === "positive" ? "var(--seo)" : sentiment === "negative" ? "var(--error)" : "var(--text-muted)";
  return (
    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
  );
}

export default function MentionsSection({ mentions }: Props) {
  const positive = mentions.filter(m => m.sentiment === "positive").length;
  const negative = mentions.filter(m => m.sentiment === "negative").length;
  const neutral = mentions.length - positive - negative;

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--ai)" }} />
        <span className="section-title" style={{ color: "var(--ai)" }}>Brand Mentions</span>
      </div>

      {mentions.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No brand mentions found across the web.
        </p>
      ) : (
        <>
          {/* Sentiment summary */}
          <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
            {[
              { label: "Total Mentions", value: String(mentions.length), accent: "var(--ai)" },
              { label: "Positive", value: String(positive), accent: "var(--seo)" },
              { label: "Neutral", value: String(neutral) },
              { label: "Negative", value: String(negative), accent: negative > 0 ? "var(--error)" : undefined },
            ].map(({ label, value, accent }) => (
              <div key={label} className="stat-cell">
                <span className="label">{label}</span>
                <span className="value-md" style={{ color: accent ?? "var(--text)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Mention list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {mentions.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: i < mentions.length - 1 ? "1px solid var(--border)" : "none" }}>
                <SentimentDot sentiment={m.sentiment} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                      {m.title || m.domain}
                    </span>
                    {m.date && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", flexShrink: 0 }}>
                        {m.date}
                      </span>
                    )}
                  </div>
                  {m.snippet && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {m.snippet}
                    </p>
                  )}
                  <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ai)", textDecoration: "none", opacity: 0.8 }}>
                    {m.domain}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
