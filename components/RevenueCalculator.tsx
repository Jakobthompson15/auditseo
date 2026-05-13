"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankedKeyword, KeywordForSite } from "@/lib/types";

// Rank #3 CTR — Backlinko / First Page Sage 2024
const CTR_RANK3 = 0.10;

// Year-1 ramp assumption: 3-6 months to achieve ranking.
// Conservative model: months 1–6 = building toward rank (0 revenue),
// months 7–12 = earning at full rank (6 months of revenue).
// So year-1 earned = monthlyRev × 6, year-1 spent = monthlyInvestment × 12.
const RAMP_EARNING_MONTHS = 6;
const RAMP_TOTAL_MONTHS = 12;

interface Props {
  rankedKeywords: RankedKeyword[];
  keywordsForSite: KeywordForSite[];
  city?: string;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function KwChip({ keyword, volume, onRemove }: { keyword: string; volume: number; onRemove?: () => void }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      fontFamily: "var(--font-mono)",
      fontSize: "0.63rem",
      color: "var(--text-dim)",
      background: "var(--card-hover)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      padding: "2px 6px 2px 8px",
      whiteSpace: "nowrap",
    }}>
      {keyword} <span style={{ opacity: 0.55 }}>· {fmt(volume)}/mo</span>
      {onRemove && (
        <button
          onClick={onRemove}
          title="Remove keyword"
          style={{
            background: "none",
            border: "none",
            padding: "0 1px",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            opacity: 0.6,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.color = "var(--error)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.6"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
        >
          ×
        </button>
      )}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border-strong)",
  borderRadius: 7,
  color: "var(--text)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.85rem",
  padding: "0.55rem 0.7rem",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.62rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--text-muted)",
  marginBottom: "0.3rem",
  display: "block",
};

export default function RevenueCalculator({ rankedKeywords, keywordsForSite, city }: Props) {
  const [jobValue, setJobValue] = useState(3000);
  const [closeRate, setCloseRate] = useState(0.5);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1299);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(3);

  // Opportunity keywords sorted by volume (exclude already-ranking + user-removed)
  const alreadyRanking = new Set(rankedKeywords.map(k => k.keyword.toLowerCase()));
  const pool = [...keywordsForSite]
    .filter(k => !alreadyRanking.has(k.keyword.toLowerCase()) && !excluded.has(k.keyword))
    .sort((a, b) => b.search_volume - a.search_volume)
    .slice(0, 10);

  const removeKeyword = (kw: string) => {
    setExcluded(prev => new Set([...prev, kw]));
    setVisibleCount(v => Math.max(1, v - 1));
  };

  const hasData = pool.length > 0;

  // Each row N = cumulative stats for top-N keywords
  const rows = Array.from({ length: Math.min(visibleCount, pool.length) }, (_, i) => {
    const slice = pool.slice(0, i + 1);
    const totalVolume = slice.reduce((s, k) => s + k.search_volume, 0);
    const visitors = Math.round(totalVolume * CTR_RANK3);
    const monthlyRev = visitors * (closeRate / 100) * jobValue;
    // Year-1 ROI: you pay 12 months, earn only after 3-6 month ramp (conservative = 6 earning months)
    const yearOneRev = monthlyRev * RAMP_EARNING_MONTHS;
    const yearOneCost = monthlyInvestment * RAMP_TOTAL_MONTHS;
    const roi = yearOneCost > 0 ? yearOneRev / yearOneCost : 0;
    return { count: i + 1, keywords: slice, visitors, monthlyRev, yearOneRev, roi };
  });

  const featuredIndex = rows.length >= 3 ? 1 : rows.length - 1;

  return (
    <div className="card fade-up no-print" style={{ marginTop: "1.5rem", border: "1px solid rgba(31,120,255,0.25)" }}>

      {/* Header */}
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>Your Growth Potential</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", background: "rgba(31,120,255,0.1)", border: "1px solid rgba(31,120,255,0.2)", borderRadius: 4, padding: "2px 7px" }}>
          ROI Estimator
        </span>
      </div>

      {/* Status */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: hasData ? "var(--seo)" : "var(--text-muted)", display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
          {hasData
            ? <><strong style={{ color: "var(--text)" }}>{pool.length}</strong> opportunity keywords{city ? ` in ${city}` : ""} · top: <strong style={{ color: "var(--text)" }}>{pool[0]?.keyword}</strong> ({fmt(pool[0]?.search_volume ?? 0)}/mo)</>
            : "No keyword data available — run the audit to see projections"}
        </span>
      </div>

      {/* Ramp notice */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "rgba(31,120,255,0.05)", border: "1px solid rgba(31,120,255,0.15)", borderRadius: 7, padding: "0.6rem 0.75rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--purple)" }}>Conservative model:</strong> SEO typically takes 3–6 months to reach rank #3.
          ROI is calculated over 12 months — assuming 6 months of earning after the ranking period.
        </span>
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
        <div>
          <label style={labelStyle}>Avg. Job Value</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
            <input
              type="number" min={100} value={jobValue}
              onChange={(e) => setJobValue(Math.max(1, Number(e.target.value)))}
              style={{ ...inputStyle, paddingLeft: "1.4rem" }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Visitor → Client %</label>
          <div style={{ position: "relative" }}>
            <input
              type="number" min={0.1} max={100} step={0.1} value={closeRate}
              onChange={(e) => setCloseRate(Math.min(100, Math.max(0.1, Number(e.target.value))))}
              style={{ ...inputStyle, paddingRight: "1.6rem" }}
            />
            <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Monthly Investment</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
            <input
              type="number" min={100} value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Math.max(1, Number(e.target.value)))}
              style={{ ...inputStyle, paddingLeft: "1.4rem" }}
            />
          </div>
        </div>
      </div>

      {/* Progressive keyword rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {rows.map((row, i) => {
          const featured = i === featuredIndex;
          return (
            <div
              key={i}
              style={{
                border: `1px solid ${featured ? "var(--purple)" : "var(--border)"}`,
                borderRadius: 10,
                padding: "0.875rem 1rem",
                background: featured ? "rgba(31,120,255,0.06)" : "var(--card)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              {featured && (
                <div style={{ position: "absolute", top: -10, left: "1rem", background: "var(--purple)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 10px", borderRadius: 9999, whiteSpace: "nowrap" }}>
                  Recommended
                </div>
              )}

              {/* Count badge */}
              <div style={{ flexShrink: 0, minWidth: 36, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 900, color: featured ? "var(--purple)" : "var(--text-dim)", lineHeight: 1 }}>
                  {row.count}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  kw{row.count !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Keyword chips — X only on the last (newest) keyword in each row */}
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.3rem", minWidth: 0 }}>
                {row.keywords.map((k, j) => (
                  <KwChip
                    key={j}
                    keyword={k.keyword}
                    volume={k.search_volume}
                    onRemove={j === row.keywords.length - 1 ? () => removeKeyword(k.keyword) : undefined}
                  />
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "1.5rem", flexShrink: 0, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
                    {fmtMoney(row.monthlyRev)}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                    / mo once ranked
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", fontWeight: 800, color: featured ? "var(--purple)" : "var(--text)", lineHeight: 1 }}>
                    {row.roi > 0 ? `${row.roi.toFixed(1)}×` : "—"}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                    yr-1 ROI
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add keyword button */}
      {pool.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(v => v + 1)}
          style={{
            marginTop: "0.625rem",
            width: "100%",
            background: "none",
            border: "1px dashed var(--border-strong)",
            borderRadius: 8,
            padding: "0.55rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            cursor: "pointer",
            letterSpacing: "0.06em",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--purple)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--purple)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
        >
          + Add keyword ({pool.length - visibleCount} more)
        </button>
      )}

      <p style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        Rank #3 CTR = {(CTR_RANK3 * 100).toFixed(0)}% (Backlinko 2024) · Year-1 ROI assumes 6-month ranking ramp, then 6 months earning.
        Visitor-to-client industry avg: 0.2–1% for local home services. Actual results vary.
      </p>
    </div>
  );
}
