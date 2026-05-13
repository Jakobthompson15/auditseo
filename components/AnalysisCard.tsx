"use client";

interface AnalysisCardProps {
  text: string;
  pills: string[];
}

interface AnalysisSection {
  seo: string;
  competition: string;
  recommendation: string;
}

const BULLETS: { key: keyof AnalysisSection; label: string; color: string; icon: string }[] = [
  { key: "seo", label: "SEO Authority", color: "var(--seo)", icon: "📈" },
  { key: "competition", label: "Competition", color: "var(--ai)", icon: "🏁" },
  { key: "recommendation", label: "Recommendation", color: "var(--purple)", icon: "🎯" },
];

export default function AnalysisCard({ text, pills }: AnalysisCardProps) {
  let structured: AnalysisSection | null = null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed && typeof parsed.seo === "string" && (typeof parsed.competition === "string" || typeof parsed.ai === "string")) {
      const p = parsed as Record<string, unknown>;
      // support both old "ai" key and new "competition" key
      if (!p.competition && p.ai) p.competition = p.ai;
      structured = p as unknown as AnalysisSection;
    }
  } catch {
    // fall through to plain text
  }

  return (
    <div
      className="card fade-up analysis-card"
      style={{
        marginTop: "1.5rem",
        border: "1px solid rgba(31,120,255,0.2)",
      }}
    >
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>
          Expert Analysis
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            background: "rgba(31,120,255,0.1)",
            border: "1px solid rgba(31,120,255,0.2)",
            borderRadius: 4,
            padding: "2px 7px",
          }}
        >
          Claude
        </span>
      </div>

      {structured ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: pills.length > 0 ? "1.25rem" : 0 }}>
          {BULLETS.map(({ key, label, color }) => (
            <div
              key={key}
              style={{
                display: "flex",
                gap: "0.875rem",
                padding: "0.75rem",
                background: "var(--card-hover)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color,
                  minWidth: 100,
                  paddingTop: "0.15rem",
                  flexShrink: 0,
                }}
              >
                {label}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {structured![key]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.93rem",
            lineHeight: 1.7,
            color: "var(--text)",
            marginBottom: pills.length > 0 ? "1.25rem" : 0,
          }}
        >
          {text}
        </p>
      )}

      {pills.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          {pills.map((pill) => (
            <span key={pill} className="pill">
              <svg
                width="7"
                height="7"
                viewBox="0 0 7 7"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="3.5" cy="3.5" r="3.5" fill="var(--purple)" />
              </svg>
              {pill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
