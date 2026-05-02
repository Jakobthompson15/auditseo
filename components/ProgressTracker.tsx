"use client";

import type { StepStatus } from "@/lib/types";

interface ProgressTrackerProps {
  steps: StepStatus[];
  onRetry?: (stepId: string) => void;
}

function StatusIcon({ status }: { status: StepStatus["status"] }) {
  if (status === "running") return <span className="spinner" aria-label="Running" />;
  if (status === "done")
    return (
      <svg
        className="check-icon"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-label="Done"
      >
        <circle cx="7" cy="7" r="7" fill="rgba(79,235,180,0.18)" />
        <path
          d="M4 7l2.2 2.2 3.8-4"
          stroke="#4febb4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (status === "error")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Error">
        <circle cx="7" cy="7" r="7" fill="rgba(247,79,110,0.18)" />
        <path d="M5 5l4 4M9 5l-4 4" stroke="#f74f6e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "1px solid var(--border-strong)",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export default function ProgressTracker({ steps, onRetry }: ProgressTrackerProps) {
  return (
    <div
      className="card fade-up"
      style={{ maxWidth: 520, margin: "0 auto", padding: "1.25rem 1.5rem" }}
      role="status"
      aria-live="polite"
      aria-label="Audit progress"
    >
      <p className="label mb-4" style={{ letterSpacing: "0.12em" }}>
        Audit Progress
      </p>

      <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {steps.map((step, i) => (
          <li
            key={step.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              opacity: step.status === "pending" ? 0.4 : 1,
              transition: "opacity 0.3s",
            }}
          >
            {/* connector line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
              }}
            >
              <StatusIcon status={step.status} />
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    minHeight: 18,
                    background: "var(--border)",
                    marginTop: 4,
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                  color:
                    step.status === "running"
                      ? "var(--text)"
                      : step.status === "done"
                      ? "var(--seo)"
                      : step.status === "error"
                      ? "var(--error)"
                      : "var(--text-muted)",
                  fontWeight: step.status === "running" ? 500 : 400,
                }}
              >
                {step.label}
              </span>

              {step.status === "error" && step.error && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: "0.75rem",
                    color: "var(--error)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {step.error}
                  {onRetry && (
                    <button
                      onClick={() => onRetry(step.id)}
                      style={{
                        marginLeft: "0.5rem",
                        background: "none",
                        border: "none",
                        color: "var(--purple)",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                      aria-label={`Retry ${step.label}`}
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
