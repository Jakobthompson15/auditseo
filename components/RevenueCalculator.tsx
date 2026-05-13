"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankedKeyword, OpportunityKeyword } from "@/lib/types";

const CTR_TOP3 = 0.110;
const CTR_TOP1 = 0.276;

const INDUSTRY_CVR: Record<string, number> = {
  "Local Services":           0.030,
  "Home Improvement":         0.025,
  "Legal & Professional":     0.020,
  "Healthcare":               0.020,
  "Real Estate":              0.015,
  "Financial Services":       0.015,
  "Restaurant & Hospitality": 0.040,
  "E-commerce":               0.025,
  "Technology":               0.020,
  "Marketing & Advertising":  0.020,
};

const INDUSTRIES = Object.keys(INDUSTRY_CVR);

interface Props {
  rankedKeywords: RankedKeyword[];
  opportunityKeywords: OpportunityKeyword[];
  city?: string;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function KwChip({ keyword, volume }: { keyword: string; volume: number }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.63rem",
      color: "var(--text-dim)",
      background: "var(--card-hover)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      padding: "2px 8px",
      whiteSpace: "nowrap",
    }}>
      {keyword} <span style={{ opacity: 0.55 }}>· {fmt(volume)}/mo</span>
    </span>
  );
}

export default function RevenueCalculator({ rankedKeywords, opportunityKeywords, city }: Props) {
  const [industry, setIndustry] = useState("Local Services");
  const [ticketSize, setTicketSize] = useState(3000);
  const [closeRate, setCloseRate] = useState(20);

  const cvr = INDUSTRY_CVR[industry] ?? 0.025;

  // Use top 3 keywords by search volume for each plan
  const top3Ranked = [...rankedKeywords].sort((a, b) => b.search_volume - a.search_volume).slice(0, 3);
  const top3Opportunity = [...opportunityKeywords].sort((a, b) => b.search_volume - a.search_volume).slice(0, 3);
  const top3Combined = [...rankedKeywords, ...opportunityKeywords]
    .sort((a, b) => b.search_volume - a.search_volume).slice(0, 3);

  const rankedVolume = top3Ranked.reduce((s, k) => s + k.search_volume, 0);
  const opportunityVolume = top3Opportunity.reduce((s, k) => s + k.search_volume, 0);
  const combinedVolume = top3Combined.reduce((s, k) => s + k.search_volume, 0);

  const hasData = rankedVolume > 0 || opportunityVolume > 0;

  const PACKAGES = [
    {
      name: "Silver",
      price: 799,
      baseVolume: rankedVolume,
      ctr: CTR_TOP3,
      positionLabel: "Current kws → Top 3",
      description: `Top 3 positions on top 3 ranked keywords`,
      keywords: top3Ranked,
      color: "#8B9AAD",
      colorDim: "rgba(139,154,173,0.08)",
      featured: false,
    },
    {
      name: "Gold",
      price: 1299,
      baseVolume: opportunityVolume,
      ctr: CTR_TOP1,
      positionLabel: "Opportunity kws → #1",
      description: `Rank #1 on top 3 opportunity keywords`,
      keywords: top3Opportunity,
      color: "var(--purple)",
      colorDim: "rgba(31,120,255,0.12)",
      featured: true,
    },
    {
      name: "Platinum",
      price: 1999,
      baseVolume: combinedVolume,
      ctr: CTR_TOP1,
      positionLabel: "Full domination",
      description: `Rank #1 across top 3 highest-volume keywords`,
      keywords: top3Combined,
      color: "#38bdf8",
      colorDim: "rgba(56,189,248,0.08)",
      featured: false,
    },
  ] as const;

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

      {/* Data source status */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: hasData ? "var(--seo)" : "var(--text-muted)", display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
          {hasData
            ? <>Live data — <strong style={{ color: "var(--text)" }}>{fmt(rankedVolume)}</strong> ranked searches/mo · <strong style={{ color: "var(--text)" }}>{fmt(opportunityVolume)}</strong> opportunity searches/mo{city ? ` in ${city}` : ""}</>
            : "No keyword data available — run the audit to see projections"}
        </span>
      </div>

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
          const visitors = Math.round(pkg.baseVolume * pkg.ctr);
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
                background: pkg.featured ? pkg.colorDim : "var(--card)",
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

              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: pkg.color, fontWeight: 700 }}>{pkg.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.15 }}>
                  ${pkg.price.toLocaleString()}
                  <span style={{ fontSize: "0.62rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                </div>
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: pkg.color, background: `${pkg.color}18`, border: `1px solid ${pkg.color}44`, borderRadius: 4, padding: "2px 7px", display: "inline-block", alignSelf: "flex-start" }}>
                {pkg.positionLabel}
              </div>

              {/* Top keywords for this plan */}
              {pkg.keywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {pkg.keywords.map((k, i) => (
                    <KwChip key={i} keyword={k.keyword} volume={k.search_volume} />
                  ))}
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border)" }} />

              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{fmt(visitors)}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>visitors / mo</div>
              </div>

              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 800, color: pkg.color, lineHeight: 1 }}>{fmtMoney(sixMonthRev)}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>6-month revenue</div>
              </div>

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
        Based on top 3 keywords by search volume from this audit.
        Silver: {fmt(rankedVolume)}/mo ranked · Gold: {fmt(opportunityVolume)}/mo opportunity · Platinum: {fmt(combinedVolume)}/mo combined.
        CTR benchmarks: Top 3 = {(CTR_TOP3 * 100).toFixed(0)}%, Rank #1 = {(CTR_TOP1 * 100).toFixed(0)}%. Actual results vary.
      </p>
    </div>
  );
}
