"use client";

import { useEffect, useState } from "react";

interface ScoreCardProps {
  label: string;
  score: number;
  accent: string;
  accentDim: string;
  sublabel: string;
}

export default function ScoreCard({
  label,
  score,
  accent,
  accentDim,
  sublabel,
}: ScoreCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(timeout);
  }, [score]);

  const grade =
    score >= 80
      ? "Excellent"
      : score >= 60
      ? "Good"
      : score >= 40
      ? "Moderate"
      : score >= 20
      ? "Weak"
      : "Low";

  return (
    <div
      className="card fade-up"
      style={{
        flex: 1,
        border: `1px solid ${accentDim}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: accentDim,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <p className="label" style={{ marginBottom: "0.5rem" }}>
          {label}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.375rem",
            marginBottom: "0.25rem",
          }}
        >
          <span
            className="value-lg"
            style={{ color: accent }}
            aria-label={`${label}: ${score} out of 100`}
          >
            {score}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            / 100
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: accent,
              opacity: 0.85,
            }}
          >
            {grade}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {sublabel}
          </span>
        </div>

        <div className="gauge-track">
          <div
            className="gauge-fill"
            style={{
              width: `${displayed}%`,
              background: `linear-gradient(90deg, ${accentDim.replace("0.15", "0.6")}, ${accent})`,
            }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}
