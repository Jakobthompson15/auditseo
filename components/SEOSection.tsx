"use client";

import type { RankData, BacklinkData } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface SEOSectionProps {
  rank: RankData;
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
      <span
        className="value-md"
        style={{ color: accent ?? "var(--text)" }}
      >
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          width: 64,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 9999,
            background: color,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "var(--text-dim)",
          width: 48,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {fmt(count)}
      </span>
    </div>
  );
}

export default function SEOSection({ rank, backlinks }: SEOSectionProps) {
  const totalPositioned =
    rank.pos_1_3 + rank.pos_4_10 + rank.pos_11_20 + rank.pos_21_100;

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--seo)" }} />
        <span className="section-title" style={{ color: "var(--seo)" }}>
          SEO Performance
        </span>
      </div>

      {/* Stat grid */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCell
          label="Domain Rank"
          value={String(backlinks.rank)}
          accent="var(--seo)"
        />
        <StatCell
          label="Organic Keywords"
          value={fmt(rank.organic_count)}
        />
        <StatCell
          label="Est. Monthly Traffic"
          value={fmt(rank.organic_etv)}
        />
        <StatCell
          label="Referring Domains"
          value={fmt(backlinks.referring_domains)}
        />
        <StatCell
          label="Total Backlinks"
          value={fmt(backlinks.total_backlinks)}
        />
        <StatCell
          label="Dofollow Links"
          value={fmt(backlinks.dofollow)}
          accent="var(--seo)"
        />
      </div>

      {/* Ranking distribution */}
      <p className="label" style={{ marginBottom: "0.875rem" }}>
        Ranking Distribution
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <DistBar
          label="Pos 1–3"
          count={rank.pos_1_3}
          total={totalPositioned}
          color="var(--seo)"
        />
        <DistBar
          label="Pos 4–10"
          count={rank.pos_4_10}
          total={totalPositioned}
          color="var(--purple)"
        />
        <DistBar
          label="Pos 11–20"
          count={rank.pos_11_20}
          total={totalPositioned}
          color="rgba(124,106,247,0.5)"
        />
        <DistBar
          label="Pos 21–100"
          count={rank.pos_21_100}
          total={totalPositioned}
          color="rgba(255,255,255,0.15)"
        />
      </div>
    </div>
  );
}
