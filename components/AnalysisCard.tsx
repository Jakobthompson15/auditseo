"use client";

interface AnalysisCardProps {
  text: string;
  pills: string[];
}

export default function AnalysisCard({ text, pills }: AnalysisCardProps) {
  return (
    <div
      className="card fade-up"
      style={{
        marginTop: "1.5rem",
        background:
          "linear-gradient(135deg, rgba(124,106,247,0.07) 0%, rgba(17,17,24,1) 60%)",
        border: "1px solid rgba(124,106,247,0.2)",
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
            background: "rgba(124,106,247,0.1)",
            border: "1px solid rgba(124,106,247,0.2)",
            borderRadius: 4,
            padding: "2px 7px",
          }}
        >
          Claude
        </span>
      </div>

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
