"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankData, KeywordItem } from "@/lib/types";

// CTR by target ranking position (industry-average organic CTR)
const CTR: Record<number, number> = {
  1: 0.276,
  2: 0.158,
  3: 0.110,
  5: 0.063,
  10: 0.040,
};

// Plan tiers: Silver ranks #1 for 1 keyword, Gold #1 for top keyword,
// Platinum #1 for top 3 keywords combined
const PACKAGES = [
  {
    name: "Silver",
    price: 799,
    targetPosition: 3,   // gets to top 3
    keywordCount: 1,
    positionLabel: "Top 3",
    color: "#8B9AAD",
    colorDim: "rgba(139,154,173,0.10)",
    featured: false,
  },
  {
    name: "Gold",
    price: 1299,
    targetPosition: 1,   // gets to #1
    keywordCount: 1,
    positionLabel: "#1",
    color: "var(--purple)",
    colorDim: "rgba(31,120,255,0.15)",
    featured: true,
  },
  {
    name: "Platinum",
    price: 1999,
    targetPosition: 1,   // gets to #1 for top 3 keywords
    keywordCount: 3,
    positionLabel: "#1",
    color: "#7DD4FC",
    colorDim: "rgba(125,212,252,0.10)",
    featured: false,
  },
] as const;

type PlanName = "Silver" | "Gold" | "Platinum";

const INDUSTRIES = [
  "Local Services",
  "Legal & Professional",
  "Healthcare",
  "Home Improvement",
  "Real Estate",
  "Financial Services",
  "E-commerce",
  "Restaurant & Hospitality",
  "Technology",
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

interface RevenueCalculatorProps {
  rank: RankData;
  keywords?: KeywordItem[];
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function StatRow({ label, value, highlight, large }: { label: string; value: string; highlight?: string; large?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.55rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: large ? "1.05rem" : "0.88rem",
          color: highlight ?? "var(--text)",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function RevenueCalculator({ rank, keywords = [] }: RevenueCalculatorProps) {
  const [industry, setIndustry] = useState<string>("Local Services");
  const [ticketSize, setTicketSize] = useState<number>(3000);
  const [closeRate, setCloseRate] = useState<number>(20);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>("Gold");
  const [selectedKwIdx, setSelectedKwIdx] = useState<number>(0);

  // Sort keywords by search volume descending — these are the targets
  const sortedKws = [...keywords].sort((a, b) => b.search_volume - a.search_volume);
  const hasKeywords = sortedKws.length > 0;

  const cvr = INDUSTRY_CVR[industry] ?? 0.02;
  const pkg = PACKAGES.find((p) => p.name === selectedPlan)!;

  // Calculate projected visitors based on keyword search volume × CTR for target position
  function projectVisitors(): number {
    if (!hasKeywords) {
      // Fallback when no keyword data: use organic_count as a proxy
      const base = rank.organic_traffic > 0 ? rank.organic_traffic : Math.max(50, rank.organic_count * 5);
      return Math.round(base * CTR[pkg.targetPosition]);
    }
    const primaryKw = sortedKws[Math.min(selectedKwIdx, sortedKws.length - 1)];
    if (pkg.keywordCount === 1) {
      return Math.round(primaryKw.search_volume * CTR[pkg.targetPosition]);
    }
    // Platinum: sum top 3 from selected keyword onwards
    const kws = sortedKws.slice(selectedKwIdx, selectedKwIdx + 3);
    return kws.reduce((sum, kw) => sum + Math.round(kw.search_volume * CTR[pkg.targetPosition]), 0);
  }

  const projectedVisitors = projectVisitors();
  const monthlyLeads = projectedVisitors * cvr;
  const monthlyClients = monthlyLeads * (closeRate / 100);
  const monthlyRevenue = monthlyClients * ticketSize;
  const sixMonthRevenue = monthlyRevenue * 6;
  const sixMonthCost = pkg.price * 6;
  const roi = sixMonthCost > 0 ? sixMonthRevenue / sixMonthCost : 0;

  const primaryKw = hasKeywords ? sortedKws[Math.min(selectedKwIdx, sortedKws.length - 1)] : null;
  const targetKwsForPlatinum = pkg.keywordCount === 3
    ? sortedKws.slice(selectedKwIdx, selectedKwIdx + 3)
    : null;

  const inputStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
    padding: "0.6rem 0.75rem",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
    marginBottom: "0.35rem",
    display: "block",
  };

  return (
    <div
      className="card fade-up no-print"
      style={{
        marginTop: "1.5rem",
        border: "1px solid rgba(31,120,255,0.25)",
      }}
    >
      {/* Header */}
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>
          Keyword ROI Projector
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
          6-Month ROI
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
          lineHeight: 1.6,
        }}
      >
        {hasKeywords
          ? `Select a keyword below. We project traffic based on ranking ${pkg.positionLabel} for that keyword (${(CTR[pkg.targetPosition] * 100).toFixed(0)}% average click-through rate at that position).`
          : "Based on your current SEO footprint. Run an audit first to model keyword-specific ROI."}
      </p>

      {/* Keyword selector */}
      {hasKeywords && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Target Keyword</label>
          <select
            value={selectedKwIdx}
            onChange={(e) => setSelectedKwIdx(Number(e.target.value))}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {sortedKws.map((kw, i) => (
              <option key={`${kw.keyword}-${i}`} value={i}>
                {kw.keyword} — {fmt(kw.search_volume)}/mo searches
                {kw.rank > 0 ? ` (currently #${kw.rank})` : ""}
              </option>
            ))}
          </select>
          {primaryKw && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              {fmt(primaryKw.search_volume)} monthly searches × {(CTR[pkg.targetPosition] * 100).toFixed(0)}% CTR at {pkg.positionLabel} = <strong style={{ color: "var(--text)" }}>{fmt(pkg.keywordCount === 1 ? projectedVisitors : Math.round(primaryKw.search_volume * CTR[pkg.targetPosition]))} visitors/mo</strong> from this keyword alone
              {pkg.keywordCount === 3 && targetKwsForPlatinum && ` (+${fmt(projectedVisitors - Math.round(primaryKw.search_volume * CTR[pkg.targetPosition]))} from next 2 keywords)`}
            </p>
          )}
        </div>
      )}

      {/* Business inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <label style={labelStyle}>Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Avg. Ticket Size</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
            <input
              type="number"
              min={100}
              value={ticketSize}
              onChange={(e) => setTicketSize(Math.max(1, Number(e.target.value)))}
              style={{ ...inputStyle, paddingLeft: "1.5rem" }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Close Rate</label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min={1}
              max={100}
              value={closeRate}
              onChange={(e) => setCloseRate(Math.min(100, Math.max(1, Number(e.target.value))))}
              style={{ ...inputStyle, paddingRight: "1.75rem" }}
            />
            <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
          </div>
        </div>
      </div>

      {/* Plan selector tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "0.3rem",
        }}
      >
        {PACKAGES.map((p) => {
          const active = selectedPlan === p.name;
          return (
            <button
              key={p.name}
              onClick={() => setSelectedPlan(p.name as PlanName)}
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                border: active ? `1px solid ${p.color}` : "1px solid transparent",
                borderRadius: 8,
                background: active ? (p.colorDim as string) : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.1rem",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: active ? p.color : "var(--text-muted)", fontWeight: active ? 700 : 400 }}>
                {p.name}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: active ? "var(--text)" : "var(--text-muted)" }}>
                ${p.price.toLocaleString()}/mo
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: active ? p.color : "var(--text-muted)" }}>
                Rank {p.positionLabel} · {p.keywordCount === 1 ? "1 keyword" : `${p.keywordCount} keywords`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          border: `1px solid ${pkg.color}55`,
          borderRadius: 10,
          padding: "1.25rem",
          background: pkg.colorDim as string,
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: pkg.color, marginBottom: "0.75rem", fontWeight: 700 }}>
          {pkg.name} Plan — 6-Month Projection
          {primaryKw && <span style={{ fontWeight: 400, marginLeft: "0.5rem", opacity: 0.8 }}>· &ldquo;{primaryKw.keyword}&rdquo;</span>}
        </div>

        {hasKeywords && primaryKw && (
          <StatRow
            label={`Keyword search volume / mo`}
            value={fmt(pkg.keywordCount === 3 && targetKwsForPlatinum
              ? targetKwsForPlatinum.reduce((s, k) => s + k.search_volume, 0)
              : primaryKw.search_volume)}
          />
        )}
        <StatRow
          label={`Projected visitors / mo (rank ${pkg.positionLabel}, ${(CTR[pkg.targetPosition] * 100).toFixed(0)}% CTR)`}
          value={`+${fmt(projectedVisitors)}`}
        />
        <StatRow
          label={`Lead Gen Rate (${(cvr * 100).toFixed(1)}% of visitors)`}
          value={monthlyLeads < 1 ? `${monthlyLeads.toFixed(1)} leads/mo` : `${fmt(Math.round(monthlyLeads))} leads/mo`}
        />
        <StatRow
          label={`Close Rate (${closeRate}% of leads)`}
          value={monthlyClients < 1 ? `${monthlyClients.toFixed(2)} clients/mo` : `${monthlyClients.toFixed(1)} clients/mo`}
        />
        <StatRow label="New Revenue / mo" value={fmtMoney(monthlyRevenue)} />
        <StatRow label="6-Month Revenue" value={fmtMoney(sixMonthRevenue)} highlight={pkg.color} large />
        <StatRow label="6-Month Investment" value={fmtMoney(sixMonthCost)} />
      </div>

      {/* Narrative */}
      <div
        style={{
          border: `1px solid ${pkg.color}44`,
          borderRadius: 10,
          padding: "1rem 1.25rem",
          background: "rgba(0,0,0,0.03)",
          marginBottom: "0.5rem",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text)", lineHeight: 1.7, margin: 0 }}>
          {primaryKw
            ? <>
                <strong>&ldquo;{primaryKw.keyword}&rdquo;</strong> gets{" "}
                <strong>{fmt(primaryKw.search_volume)} searches/month</strong>.{" "}
                Ranking {pkg.positionLabel} delivers roughly{" "}
                <strong>{(CTR[pkg.targetPosition] * 100).toFixed(0)}% of those clicks</strong> —{" "}
                <strong style={{ color: pkg.color }}>{fmt(projectedVisitors)} visitors/mo</strong>.
                {" "}At {(cvr * 100).toFixed(1)}% lead conversion and {closeRate}% close rate, that&apos;s{" "}
                <strong style={{ color: pkg.color }}>{fmtMoney(sixMonthRevenue)}</strong> over 6 months against a{" "}
                <strong>{fmtMoney(sixMonthCost)}</strong> investment.{" "}
              </>
            : <>
                On the <strong style={{ color: pkg.color }}>{pkg.name} plan</strong>, projecting{" "}
                <strong>{fmt(projectedVisitors)} new visitors/mo</strong> at{" "}
                {(cvr * 100).toFixed(1)}% CVR and {closeRate}% close rate generates{" "}
                <strong style={{ color: pkg.color }}>{fmtMoney(sixMonthRevenue)}</strong> over 6 months.{" "}
              </>
          }
          {roi > 0 && (
            <strong style={{ color: pkg.color, fontSize: "0.9rem" }}>
              That&apos;s a {roi.toFixed(1)}× return.
            </strong>
          )}
        </p>
      </div>

      <p style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
        CTR benchmarks based on industry-average organic click-through rates by position.
        Conversion rates are industry averages — actual results vary.
      </p>
    </div>
  );
}
