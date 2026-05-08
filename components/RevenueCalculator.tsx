"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";

// Realistic monthly search volume benchmark for the primary service keyword
// in each industry — what a well-optimized local business can target
const INDUSTRY_DATA: Record<string, { searchVolume: number; cvr: number }> = {
  "Local Services":          { searchVolume: 2400,  cvr: 0.030 },
  "Home Improvement":        { searchVolume: 3600,  cvr: 0.025 },
  "Legal & Professional":    { searchVolume: 1800,  cvr: 0.020 },
  "Healthcare":              { searchVolume: 2200,  cvr: 0.020 },
  "Real Estate":             { searchVolume: 4400,  cvr: 0.015 },
  "Financial Services":      { searchVolume: 1600,  cvr: 0.015 },
  "Restaurant & Hospitality":{ searchVolume: 5400,  cvr: 0.040 },
  "E-commerce":              { searchVolume: 6600,  cvr: 0.025 },
  "Technology":              { searchVolume: 2000,  cvr: 0.020 },
};

// Industry-average organic CTR by ranking position
const CTR: Record<number, number> = { 1: 0.276, 3: 0.110 };

const PACKAGES = [
  {
    name: "Silver",
    price: 799,
    targetPosition: 3,
    volumeMultiplier: 1,
    positionLabel: "Top 3",
    color: "#8B9AAD",
    colorDim: "rgba(139,154,173,0.08)",
    featured: false,
  },
  {
    name: "Gold",
    price: 1299,
    targetPosition: 1,
    volumeMultiplier: 1,
    positionLabel: "Rank #1",
    color: "var(--purple)",
    colorDim: "rgba(31,120,255,0.12)",
    featured: true,
  },
  {
    name: "Platinum",
    price: 1999,
    targetPosition: 1,
    volumeMultiplier: 2.5, // #1 across 3 related keywords
    positionLabel: "#1 · 3 keywords",
    color: "#38bdf8",
    colorDim: "rgba(56,189,248,0.08)",
    featured: false,
  },
] as const;

const INDUSTRIES = Object.keys(INDUSTRY_DATA);

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export default function RevenueCalculator() {
  const [industry, setIndustry] = useState("Local Services");
  const [ticketSize, setTicketSize] = useState(3000);
  const [closeRate, setCloseRate] = useState(20);

  const { searchVolume, cvr } = INDUSTRY_DATA[industry];

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

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Based on industry-average search volume for your market. Adjust your numbers below.
      </p>

      {/* Inputs */}
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
            <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
            <input type="number" min={100} value={ticketSize} onChange={(e) => setTicketSize(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, paddingLeft: "1.4rem" }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Close Rate</label>
          <div style={{ position: "relative" }}>
            <input type="number" min={1} max={100} value={closeRate} onChange={(e) => setCloseRate(Math.min(100, Math.max(1, Number(e.target.value))))} style={{ ...inputStyle, paddingRight: "1.6rem" }} />
            <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }} className="calculator-grid">
        {PACKAGES.map((pkg) => {
          const vol = searchVolume * pkg.volumeMultiplier;
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

      <p style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        Based on industry-average search volumes and organic CTR benchmarks by ranking position.
        Actual results vary by market and competition.
      </p>
    </div>
  );
}
