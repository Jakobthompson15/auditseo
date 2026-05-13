"use client";

import type { DomainRankOverview } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  overview: DomainRankOverview;
}

export default function DomainRankOverviewSection({ overview }: Props) {
  const total = overview.organic_keywords || 1;
  const bars = [
    { label: "Top 3", value: overview.pos_1_3, color: "var(--seo)" },
    { label: "4–10", value: overview.pos_4_10, color: "var(--purple)" },
    { label: "11–20", value: overview.pos_11_20, color: "var(--text-dim)" },
    { label: "21–100", value: overview.pos_21_100, color: "var(--border-strong)" },
  ];

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--seo)" }} />
        <span className="section-title" style={{ color: "var(--seo)" }}>Domain Overview</span>
      </div>

      <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
        {[
          { label: "Organic Keywords", value: fmt(overview.organic_keywords), accent: "var(--seo)" },
          { label: "Top 3 Positions", value: fmt(overview.pos_1_3), accent: "var(--seo)" },
          { label: "Page 1 (4–10)", value: fmt(overview.pos_4_10), accent: "var(--purple)" },
          { label: "Page 2 (11–20)", value: fmt(overview.pos_11_20) },
        ].map(({ label, value, accent }) => (
          <div key={label} className="stat-cell">
            <span className="label">{label}</span>
            <span className="value-md" style={{ color: accent ?? "var(--text)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Position distribution bar */}
      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Position Distribution
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 9999, overflow: "hidden", gap: 2 }}>
          {bars.map(bar => {
            const pct = Math.max(0, Math.round((bar.value / total) * 100));
            if (pct === 0) return null;
            return (
              <div
                key={bar.label}
                title={`${bar.label}: ${bar.value} keywords (${pct}%)`}
                style={{ width: `${pct}%`, background: bar.color, borderRadius: 9999, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)", minWidth: 4 }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          {bars.map(bar => (
            <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: bar.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}>
                {bar.label}: {fmt(bar.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
