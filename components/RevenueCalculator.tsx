"use client";

import { useState, useEffect, useRef } from "react";
import { fmt } from "@/lib/audit";
import type { KeywordResearchResponse } from "@/app/api/keywords/route";
import type { KeywordItem } from "@/lib/types";

const CTR_TOP3 = 0.110;
const CTR_TOP1 = 0.276;

const FALLBACK_VOLUME: Record<string, number> = {
  "Local Services":           2400,
  "Home Improvement":         3600,
  "Legal & Professional":     1800,
  "Healthcare":               2200,
  "Real Estate":              4400,
  "Financial Services":       1600,
  "Restaurant & Hospitality": 5400,
  "E-commerce":               6600,
  "Technology":               2000,
};

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
};

const INDUSTRIES = Object.keys(INDUSTRY_CVR);

const PACKAGES = [
  {
    name: "Silver",
    price: 799,
    ctr: CTR_TOP3,
    volumeMultiplier: 1,
    positionLabel: "Top 3",
    color: "#8B9AAD",
    colorDim: "rgba(139,154,173,0.08)",
    featured: false,
  },
  {
    name: "Gold",
    price: 1299,
    ctr: CTR_TOP1,
    volumeMultiplier: 1,
    positionLabel: "Rank #1",
    color: "var(--purple)",
    colorDim: "rgba(31,120,255,0.12)",
    featured: true,
  },
  {
    name: "Platinum",
    price: 1999,
    ctr: CTR_TOP1,
    volumeMultiplier: 2.5,
    positionLabel: "#1 · 3 keywords",
    color: "#38bdf8",
    colorDim: "rgba(56,189,248,0.08)",
    featured: false,
  },
] as const;

interface Props {
  city?: string;
  keywords?: KeywordItem[];
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export default function RevenueCalculator({ city, keywords }: Props) {
  const [industry, setIndustry] = useState("Local Services");
  const [ticketSize, setTicketSize] = useState(3000);
  const [closeRate, setCloseRate] = useState(20);

  // Keyword selection from audit
  const [selectedKws, setSelectedKws] = useState<Set<string>>(() =>
    new Set(keywords?.filter(k => k.search_volume > 0).map(k => k.keyword) ?? [])
  );

  useEffect(() => {
    if (keywords && keywords.length > 0) {
      setSelectedKws(new Set(keywords.filter(k => k.search_volume > 0).map(k => k.keyword)));
    }
  }, [keywords]);

  // Industry/city keyword lookup (only used when no audit keywords)
  const [kwData, setKwData] = useState<KeywordResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const fetchedFor = useRef<string>("");

  const hasAuditKeywords = keywords && keywords.length > 0;

  useEffect(() => {
    if (hasAuditKeywords) return; // don't fetch if we already have audit keywords
    if (!city) return;
    const key = `${industry}::${city}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;

    setLoading(true);
    setFetchError(false);
    fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, city }),
    })
      .then((r) => r.json())
      .then((data: KeywordResearchResponse) => {
        if (data.totalVolume > 0) setKwData(data);
        else setFetchError(true);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [industry, city, hasAuditKeywords]);

  const cvr = INDUSTRY_CVR[industry] ?? 0.025;

  // Volume source priority: selected audit keywords → industry/city lookup → fallback benchmarks
  const auditSelectedVolume = hasAuditKeywords
    ? (keywords ?? [])
        .filter(k => selectedKws.has(k.keyword))
        .reduce((sum, k) => sum + k.search_volume, 0)
    : 0;

  const baseVolume = hasAuditKeywords
    ? (auditSelectedVolume > 0 ? auditSelectedVolume : 0)
    : (kwData?.totalVolume ?? FALLBACK_VOLUME[industry] ?? 2400);

  const usingAuditKws = hasAuditKeywords && auditSelectedVolume > 0;
  const usingCityData = !hasAuditKeywords && !!kwData;

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

      {/* Audit keyword chips — toggleable */}
      {hasAuditKeywords && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Select keywords to include in projection
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {keywords!.filter(k => k.search_volume > 0).map((kw) => {
              const active = selectedKws.has(kw.keyword);
              return (
                <button
                  key={kw.keyword}
                  onClick={() => {
                    setSelectedKws(prev => {
                      const next = new Set(prev);
                      if (next.has(kw.keyword)) next.delete(kw.keyword);
                      else next.add(kw.keyword);
                      return next;
                    });
                  }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.63rem",
                    color: active ? "#fff" : "var(--text-dim)",
                    background: active ? "var(--purple)" : "var(--card-hover)",
                    border: `1px solid ${active ? "var(--purple)" : "var(--border)"}`,
                    borderRadius: 4,
                    padding: "3px 9px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.12s",
                  }}
                >
                  {kw.keyword}
                  <span style={{ opacity: 0.65, marginLeft: 4 }}>· {fmt(kw.search_volume)}/mo</span>
                </button>
              );
            })}
          </div>
          {auditSelectedVolume > 0 && (
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--seo)", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text)" }}>{fmt(auditSelectedVolume)} combined searches/mo</strong> across {selectedKws.size} selected keyword{selectedKws.size !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {auditSelectedVolume === 0 && (
            <div style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
              Select at least one keyword to calculate projections.
            </div>
          )}
        </div>
      )}

      {/* Industry/city data status (only when no audit keywords) */}
      {!hasAuditKeywords && (
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {loading ? (
            <>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)", display: "inline-block", opacity: 0.6, animation: "pulse 1.2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                Fetching live keyword volumes for {industry} in {city}…
              </span>
            </>
          ) : usingCityData ? (
            <>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--seo)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                Live data — top {kwData!.keywords.length} {industry} keywords in {kwData!.city} ·{" "}
                <strong style={{ color: "var(--text)" }}>{fmt(baseVolume)} combined searches/mo</strong>
              </span>
            </>
          ) : (
            <>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                {city
                  ? fetchError
                    ? "Could not fetch live data — using industry benchmarks"
                    : `Looking up ${industry} keywords in ${city}…`
                  : "Add a city to the audit form for live keyword volumes — showing industry benchmarks"}
              </span>
            </>
          )}
        </div>
      )}

      {/* City data keyword chips (only when no audit keywords) */}
      {!hasAuditKeywords && usingCityData && kwData!.keywords.length > 0 && (
        <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {kwData!.keywords.map((kw, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.63rem",
                color: "var(--text-dim)",
                background: "var(--card-hover)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "2px 8px",
                whiteSpace: "nowrap",
              }}
            >
              {kw.keyword} <span style={{ opacity: 0.55 }}>· {fmt(kw.search_volume)}/mo</span>
            </span>
          ))}
        </div>
      )}

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

      {/* Plan cards — only show when we have volume */}
      {baseVolume > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }} className="calculator-grid">
            {PACKAGES.map((pkg) => {
              const vol = baseVolume * pkg.volumeMultiplier;
              const visitors = Math.round(vol * pkg.ctr);
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
            {usingAuditKws
              ? `Based on ${fmt(auditSelectedVolume)} combined monthly searches across ${selectedKws.size} selected keyword${selectedKws.size !== 1 ? "s" : ""}.`
              : usingCityData
              ? `Based on ${fmt(baseVolume)} combined monthly searches across top ${kwData!.keywords.length} ${industry} keywords in ${kwData!.city}.`
              : "Based on industry-average search benchmarks."}{" "}
            Projections use industry-average CTR by ranking position. Actual results vary.
          </p>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Select at least one keyword above to see projections.
        </div>
      )}
    </div>
  );
}
