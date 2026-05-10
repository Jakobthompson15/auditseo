"use client";

import type { BacklinkData } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface SEOSectionProps {
  backlinks: BacklinkData;
}

interface StatCellProps {
  label: string;
  value: string;
  accent?: string;
}

function StatCell({ label, value, accent }: StatCellProps) {
  return (
    <div className="stat-cell">
      <span className="label">{label}</span>
      <span className="value-md" style={{ color: accent ?? "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

interface DistBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function DistBar({ label, count, total, color }: DistBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", width: 72, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 9999, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, background: color, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-dim)", width: 48, textAlign: "right", flexShrink: 0 }}>
        {fmt(count)}
      </span>
    </div>
  );
}

export default function SEOSection({ backlinks }: SEOSectionProps) {
  const total = backlinks.total_backlinks || 1;
  const spamColor = backlinks.spam_score >= 60 ? "var(--error)" : backlinks.spam_score >= 30 ? "var(--ai)" : "var(--seo)";

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--seo)" }} />
        <span className="section-title" style={{ color: "var(--seo)" }}>Backlink Authority</span>
      </div>

      {/* Stat grid */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCell label="Domain Rank" value={String(backlinks.rank)} accent="var(--seo)" />
        <StatCell label="Total Backlinks" value={fmt(backlinks.total_backlinks)} />
        <StatCell label="Referring Domains" value={fmt(backlinks.referring_domains)} />
        <StatCell label="Referring IPs" value={fmt(backlinks.referring_ips)} />
        <StatCell label="Spam Score" value={`${backlinks.spam_score}%`} accent={spamColor} />
        <StatCell label="Broken Links" value={fmt(backlinks.broken_backlinks)} />
      </div>

      {/* Link attribute distribution */}
      <p className="label" style={{ marginBottom: "0.875rem" }}>Link Attributes</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <DistBar label="Dofollow" count={backlinks.dofollow} total={total} color="var(--seo)" />
        <DistBar label="Nofollow" count={backlinks.nofollow} total={total} color="var(--purple)" />
        {backlinks.ugc > 0 && (
          <DistBar label="UGC" count={backlinks.ugc} total={total} color="rgba(31,120,255,0.5)" />
        )}
        {backlinks.sponsored > 0 && (
          <DistBar label="Sponsored" count={backlinks.sponsored} total={total} color="var(--border-strong)" />
        )}
      </div>
    </div>
  );
}
