"use client";

import { useState } from "react";
import { fmt } from "@/lib/audit";
import type { RankData } from "@/lib/types";

// ── Package config — swap names/prices here ──────────────────────────────────
const PACKAGES = [
  {
    name: "Starter",
    price: 1500,
    multiplier: 0.20,
    color: "var(--seo)",
    colorDim: "rgba(79,235,180,0.12)",
    featured: false,
  },
  {
    name: "Growth",
    price: 3000,
    multiplier: 0.50,
    color: "var(--purple)",
    colorDim: "rgba(124,106,247,0.15)",
    featured: true,
  },
  {
    name: "Authority",
    price: 5000,
    multiplier: 1.00,
    color: "var(--ai)",
    colorDim: "rgba(180,106,247,0.12)",
    featured: false,
  },
] as const;

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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.45rem 0",
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
          fontSize: "0.82rem",
          color: "var(--text)",
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

  const baseline = Math.max(1, Math.round(rank.organic_etv / 3));
  const cvr = INDUSTRY_CVR[industry] ?? 0.02;

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
        border: "1px solid rgba(124,106,247,0.25)",
      }}
    >
      {/* Header */}
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>
          Your Growth Potential
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
          Revenue Estimator
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

      {/* Package cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.875rem",
        }}
        className="calculator-grid"
      >
        {PACKAGES.map((pkg) => {
          const addVisitors = Math.round(baseline * pkg.multiplier);
          const monthlyLeads = addVisitors * cvr;
          const monthlyClients = monthlyLeads * (closeRate / 100);
          const monthlyRevenue = monthlyClients * ticketSize;
          const annualRevenue = monthlyRevenue * 12;
          const annualCost = pkg.price * 12;
          const roi = annualCost > 0 ? annualRevenue / annualCost : 0;

          return (
            <div
              key={pkg.name}
              style={{
                border: `1px solid ${pkg.featured ? pkg.color : "var(--border)"}`,
                borderRadius: 10,
                padding: "1.25rem",
                background: pkg.featured ? pkg.colorDim : "var(--card)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "0.1rem",
              }}
            >
              {pkg.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: pkg.color,
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "2px 10px",
                    borderRadius: 9999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}

              {/* Package name + price */}
              <div style={{ marginBottom: "0.875rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: pkg.color,
                    marginBottom: "0.25rem",
                  }}
                >
                  {pkg.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    ${pkg.price.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    /mo
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ flex: 1 }}>
                <StatRow label="Add. Visitors/mo" value={`+${fmt(addVisitors)}`} />
                <StatRow label="Leads/mo" value={monthlyLeads < 1 ? monthlyLeads.toFixed(1) : fmt(Math.round(monthlyLeads))} />
                <StatRow label="New Clients/mo" value={monthlyClients < 1 ? monthlyClients.toFixed(2) : monthlyClients.toFixed(1)} />
                <StatRow label="Revenue/mo" value={fmtMoney(monthlyRevenue)} />
                <div style={{ padding: "0.45rem 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                      Annual Revenue
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: pkg.color,
                      }}
                    >
                      {fmtMoney(annualRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ROI badge */}
              {roi > 0 && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${pkg.color}33`,
                    borderRadius: 6,
                    padding: "0.5rem 0.75rem",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Est. ROI
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: pkg.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {roi.toFixed(1)}×
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
