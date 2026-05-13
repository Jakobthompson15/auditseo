"use client";

import type { KeywordForSite } from "@/lib/types";
import { fmt } from "@/lib/audit";

interface Props {
  keywords: KeywordForSite[];
}

export default function KeywordsForSiteSection({ keywords }: Props) {
  const maxVol = Math.max(...keywords.map(k => k.search_volume), 1);

  return (
    <div className="card fade-up" style={{ marginTop: "1.5rem" }}>
      <div className="section-header">
        <span className="section-dot" style={{ background: "var(--purple)" }} />
        <span className="section-title" style={{ color: "var(--purple)" }}>Keyword Opportunities</span>
      </div>

      {keywords.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No keyword opportunities found.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {keywords.map((kw, i) => {
              const barPct = Math.round((kw.search_volume / maxVol) * 100);
              const compLabel = kw.competition >= 0.66 ? "high" : kw.competition >= 0.33 ? "med" : "low";
              const compColor = kw.competition >= 0.66 ? "var(--error)" : kw.competition >= 0.33 ? "var(--text-dim)" : "var(--seo)";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", width: 16, textAlign: "right", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {kw.keyword}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: compColor, flexShrink: 0 }}>
                    {compLabel}
                  </span>
                  <div style={{ width: 72, height: 4, borderRadius: 9999, background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ width: `${barPct}%`, height: "100%", borderRadius: 9999, background: "var(--purple)", transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)", width: 44, textAlign: "right", flexShrink: 0 }}>
                    {fmt(kw.search_volume)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", width: 40, textAlign: "right", flexShrink: 0 }}>
                    ${kw.cpc.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: "0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
            Keywords associated with this domain, sorted by search volume. Competition: low/med/high.
          </p>
        </>
      )}
    </div>
  );
}
