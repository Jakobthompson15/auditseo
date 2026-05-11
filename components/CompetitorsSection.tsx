"use client";

import type { CompetitorDomain } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  competitors: CompetitorDomain[];
}

export default function CompetitorsSection({ competitors }: Props) {
  const maxEtv = Math.max(...competitors.map(c => c.etv), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--error)" }} />
        <span className="section-title" style={{ color: "var(--error)" }}>Organic Competitors</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {competitors.map((c, i) => {
          const etvPct = Math.round((c.etv / maxEtv) * 100);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Rank number */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", width: 18, flexShrink: 0, textAlign: "right" }}>
                {i + 1}
              </span>

              {/* Domain */}
              <span style={{ fontSize: "0.82rem", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.domain}
              </span>

              {/* Intersecting keywords */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", flexShrink: 0 }}>
                {fmt(c.intersections)} shared kws
              </span>

              {/* Traffic bar */}
              <div style={{ width: 72, height: 4, borderRadius: 9999, background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                <div style={{ width: `${etvPct}%`, height: "100%", borderRadius: 9999, background: "var(--error)", opacity: 0.7, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
              </div>

              {/* ETV */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)", width: 52, textAlign: "right", flexShrink: 0 }}>
                ${fmt(c.etv)}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
        Shared kws = keywords both domains rank for. Bar = estimated monthly traffic value.
      </p>
    </div>
  );
}
