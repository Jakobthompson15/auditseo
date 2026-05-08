"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankData, KeywordItem } from "@/lib/types";

// Industry-average organic CTR by ranking position
const CTR: Record<number, number> = { 1: 0.276, 3: 0.110 };

const PACKAGES = [
  {
    name: "Silver",
    price: 799,
    targetPosition: 3,
    keywordCount: 1,
    positionLabel: "Top 3",
    color: "#8B9AAD",
    colorDim: "rgba(139,154,173,0.08)",
    featured: false,
  },
  {
    name: "Gold",
    price: 1299,
    targetPosition: 1,
    keywordCount: 1,
    positionLabel: "Rank #1",
    color: "var(--purple)",
    colorDim: "rgba(31,120,255,0.12)",
    featured: true,
  },
  {
    name: "Platinum",
    price: 1999,
    targetPosition: 1,
    keywordCount: 3,
    positionLabel: "#1 · 3 keywords",
    color: "#38bdf8",
    colorDim: "rgba(56,189,248,0.08)",
    featured: false,
  },
] as const;

const INDUSTRY_CVR: Record<string, number> = {
  "Local Services": 0.030,
  "Legal & Professional": 0.020,
  "Healthcare": 0.020,
  "Home Improvement": 0.025,
  "Real Estate": 0.015,
  "Financial Services": 0.015,
  "E-commerce": 0.025,
  "Restaurant & Hospitality": 0.040,
  "Technology": 0.020,
};
const INDUSTRIES = Object.keys(INDUSTRY_CVR);

interface Props {
  rank: RankData;
  keywords?: KeywordItem[];
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export default function RevenueCalculator({ keywords = [] }: Props) {
  const [industry, setIndustry] = useState("Local Services");
  const [ticketSize, setTicketSize] = useState(3000);
  const [closeRate, setCloseRate] = useState(20);

  // Keyword + volume are both manually editable — the sales rep sets the RIGHT keyword
  const [kwText, setKwText] = useState("");
  const [kwVolume, setKwVolume] = useState(2400);

  // Filter out brand/navigational keywords (low volume or single-word) from audit suggestions
  const suggestions = [...keywords]
    .filter((k) => k.search_volume > 200 && k.keyword.includes(" "))
    .sort((a, b) => b.search_volume - a.search_volume)
    .slice(0, 5);

  const displayKw = kwText.trim() || "your target keyword";
  const cvr = INDUSTRY_CVR[industry] ?? 0.025;

  const inputStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border-strong)",
    borderRadius: 7,
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    padding: "0.5rem 0.65rem",
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

  return (
    <div className="card fade-up no-print" style={{ marginTop: "1.5rem", border: "1px solid rgba(31,120,255,0.25)" }}>

      {/* Header */}
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>Keyword ROI Projector</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", background: "rgba(31,120,255,0.1)", border: "1px solid rgba(31,120,255,0.2)", borderRadius: 4, padding: "2px 7px" }}>
          6-Month ROI
        </span>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Enter a high-volume keyword your client should rank for — not just what they rank for today.
        We&apos;ll show the ROI of getting them to that position.
      </p>

      {/* Keyword + volume inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", marginBottom: suggestions.length > 0 ? "0.75rem" : "1.5rem", alignItems: "end" }}>
        <div>
          <label style={labelStyle}>Target Keyword</label>
          <input
            type="text"
            placeholder='e.g. "window replacement chicago"'
            value={kwText}
            onChange={(e) => setKwText(e.target.value)}
            style={inputStyle}
            spellCheck={false}
          />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={labelStyle}>Monthly Searches</label>
          <input
            type="number"
            min={100}
            value={kwVolume}
            onChange={(e) => setKwVolume(Math.max(1, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Audit keyword suggestions — only multi-word, meaningful volume */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            From audit —
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}> quick picks:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
            {suggestions.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setKwText(kw.keyword); setKwVolume(kw.search_volume); }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: kwText === kw.keyword ? "var(--purple)" : "var(--text-dim)",
                  background: kwText === kw.keyword ? "rgba(31,120,255,0.1)" : "var(--card-hover)",
                  border: `1px solid ${kwText === kw.keyword ? "rgba(31,120,255,0.3)" : "var(--border)"}`,
                  borderRadius: 5,
                  padding: "3px 9px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {kw.keyword} <span style={{ opacity: 0.6 }}>· {fmt(kw.search_volume)}/mo</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
        <div>
          <label style={labelStyle}>Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Avg. Ticket Size</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
            <input type="number" min={100} value={ticketSize} onChange={(e) => setTicketSize(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, paddingLeft: "1.35rem" }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Close Rate</label>
          <div style={{ position: "relative" }}>
            <input type="number" min={1} max={100} value={closeRate} onChange={(e) => setCloseRate(Math.min(100, Math.max(1, Number(e.target.value))))} style={{ ...inputStyle, paddingRight: "1.6rem" }} />
            <span style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }} className="calculator-grid">
        {PACKAGES.map((pkg) => {
          const vol = pkg.keywordCount === 3 ? kwVolume * 2.2 : kwVolume;
          const visitors = Math.round(vol * CTR[pkg.targetPosition]);
          const leads = visitors * cvr;
          const clients = leads * (closeRate / 100);
          const monthlyRev = clients * ticketSize;
          const sixMonthRev = monthlyRev * 6;
          const sixMonthCost = pkg.price * 6;
          const roi = sixMonthCost > 0 ? sixMonthRev / sixMonthCost : 0;

          return (
            <div
              key={pkg.name}
              style={{
                border: `1px solid ${pkg.featured ? pkg.color : "var(--border)"}`,
                borderRadius: 10,
                padding: "1.1rem 1rem",
                background: pkg.featured ? (pkg.colorDim as string) : "var(--card)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {pkg.featured && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: pkg.color, color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 10px", borderRadius: 9999, whiteSpace: "nowrap" }}>
                  Most Popular
                </div>
              )}

              {/* Name + price */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: pkg.color, fontWeight: 700 }}>{pkg.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.15 }}>
                  ${pkg.price.toLocaleString()}
                  <span style={{ fontSize: "0.62rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                </div>
              </div>

              {/* Position badge */}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: pkg.color, background: `${pkg.color}18`, border: `1px solid ${pkg.color}44`, borderRadius: 4, padding: "2px 7px", display: "inline-block", alignSelf: "flex-start" }}>
                {pkg.positionLabel}
              </div>

              <div style={{ borderTop: "1px solid var(--border)" }} />

              {/* Visitors */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{fmt(visitors)}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>visitors / mo</div>
              </div>

              {/* 6-mo revenue */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 800, color: pkg.color, lineHeight: 1 }}>{fmtMoney(sixMonthRev)}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>6-month revenue</div>
              </div>

              {/* ROI */}
              <div style={{ marginTop: "auto", background: "rgba(0,0,0,0.04)", border: `1px solid ${pkg.color}33`, borderRadius: 6, padding: "0.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 900, color: pkg.color, lineHeight: 1 }}>
                  {roi > 0 ? `${roi.toFixed(1)}×` : "—"}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>return on investment</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        &ldquo;{displayKw}&rdquo; · {fmt(kwVolume)} searches/mo · projections use industry-average CTR at each ranking position.
        Platinum estimates top 3 related keywords combined.
      </p>
    </div>
  );
}
