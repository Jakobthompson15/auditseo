"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankData } from "@/lib/types";

const PACKAGES = [
  {
    name: "Silver",
    price: 799,
    multiplier: 0.20,
    color: "#8B9AAD",
    colorDim: "rgba(139,154,173,0.10)",
    featured: false,
  },
  {
    name: "Gold",
    price: 1299,
    multiplier: 0.50,
    color: "var(--purple)",
    colorDim: "rgba(31,120,255,0.15)",
    featured: true,
  },
  {
    name: "Platinum",
    price: 1999,
    multiplier: 1.00,
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
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
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
          fontSize: "0.88rem",
          color: highlight ?? "var(--text)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function RevenueCalculator({ rank }: RevenueCalculatorProps) {
  const [industry, setIndustry] = useState<string>("Local Services");
  const [ticketSize, setTicketSize] = useState<number>(3000);
  const [closeRate, setCloseRate] = useState<number>(20);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>("Gold");

  const baseline = rank.organic_traffic > 0
    ? rank.organic_traffic
    : Math.max(10, rank.organic_count * 3);
  const cvr = INDUSTRY_CVR[industry] ?? 0.02;
  const pkg = PACKAGES.find((p) => p.name === selectedPlan)!;

  const addVisitors = Math.round(baseline * pkg.multiplier);
  const monthlyLeads = addVisitors * cvr;
  const monthlyClients = monthlyLeads * (closeRate / 100);
  const monthlyRevenue = monthlyClients * ticketSize;
  const sixMonthRevenue = monthlyRevenue * 6;
  const sixMonthCost = pkg.price * 6;
  const roi = sixMonthCost > 0 ? sixMonthRevenue / sixMonthCost : 0;

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
          Your 6-Month Growth Potential
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
          ROI Estimator
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
        Based on your current SEO footprint (~{fmt(baseline)} est. monthly visitors). Adjust inputs to model your market.
      </p>

      {/* Inputs */}
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
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Avg. Ticket Size</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            >
              $
            </span>
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
              onChange={(e) =>
                setCloseRate(Math.min(100, Math.max(1, Number(e.target.value))))
              }
              style={{ ...inputStyle, paddingRight: "1.75rem" }}
            />
            <span
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            >
              %
            </span>
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
                gap: "0.15rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: active ? p.color : "var(--text-muted)",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: active ? "var(--text)" : "var(--text-muted)",
                }}
              >
                ${p.price.toLocaleString()}/mo
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats for selected plan */}
      <div
        style={{
          border: `1px solid ${pkg.color}55`,
          borderRadius: 10,
          padding: "1.25rem",
          background: pkg.colorDim as string,
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: pkg.color,
            marginBottom: "0.75rem",
            fontWeight: 700,
          }}
        >
          {pkg.name} Plan — 6-Month Projection
        </div>

        <StatRow label="Additional Visitors / mo" value={`+${fmt(addVisitors)}`} />
        <StatRow
          label={`Lead Gen Rate (${(cvr * 100).toFixed(1)}% of visitors)`}
          value={monthlyLeads < 1 ? `${monthlyLeads.toFixed(1)} leads/mo` : `${fmt(Math.round(monthlyLeads))} leads/mo`}
        />
        <StatRow
          label={`Close Rate (${closeRate}% of leads)`}
          value={monthlyClients < 1 ? `${monthlyClients.toFixed(2)} clients/mo` : `${monthlyClients.toFixed(1)} clients/mo`}
        />
        <StatRow label="New Revenue / mo" value={fmtMoney(monthlyRevenue)} />
        <StatRow
          label="6-Month Revenue"
          value={fmtMoney(sixMonthRevenue)}
          highlight={pkg.color}
        />
        <StatRow label="6-Month Investment" value={fmtMoney(sixMonthCost)} />
      </div>

      {/* Narrative summary */}
      <div
        style={{
          border: `1px solid ${pkg.color}44`,
          borderRadius: 10,
          padding: "1rem 1.25rem",
          background: "rgba(0,0,0,0.03)",
          marginBottom: "0.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--text)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          At the end of 6 months on the{" "}
          <strong style={{ color: pkg.color }}>{pkg.name} plan</strong>, you&apos;d gain{" "}
          <strong>+{fmt(addVisitors)} extra visitors/month</strong>, convert{" "}
          <strong>{(cvr * 100).toFixed(1)}%</strong> into leads, and close{" "}
          <strong>{closeRate}%</strong> of those — generating{" "}
          <strong style={{ color: pkg.color }}>{fmtMoney(sixMonthRevenue)}</strong> in new
          revenue against a <strong>{fmtMoney(sixMonthCost)}</strong> investment.{" "}
          {roi > 0 && (
            <>
              That&apos;s a{" "}
              <strong style={{ color: pkg.color, fontSize: "0.9rem" }}>
                {roi.toFixed(1)}× return
              </strong>{" "}
              in just 6 months.
            </>
          )}
        </p>
      </div>

      <p
        style={{
          marginTop: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Estimates based on industry-average conversion rates and your current organic footprint.
        Actual results vary by market competitiveness and execution.
      </p>
    </div>
  );
}
