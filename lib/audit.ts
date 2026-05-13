import type { RankedKeyword, DomainRankOverview } from "./types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtCpc(n: number): string {
  return `$${n.toFixed(2)}`;
}

// SEO Score: based on domain rank overview — keyword count + position distribution
export function computeSEOScore(overview: DomainRankOverview): number {
  if (overview.organic_keywords === 0) return 0;

  // Keyword count (35 pts) — log scale; 500 keywords = full score
  const countScore = Math.min(35, (Math.log10(Math.max(1, overview.organic_keywords)) / Math.log10(500)) * 35);

  // Top-3 ratio (40 pts) — 20% in top 3 = full score
  const top3Ratio = overview.pos_1_3 / overview.organic_keywords;
  const posScore = Math.min(40, top3Ratio * 200);

  // Page-1 ratio (25 pts) — 25% on page 1 = full score
  const page1 = overview.pos_1_3 + overview.pos_4_10;
  const page1Score = Math.min(25, (page1 / overview.organic_keywords) * 100);

  return Math.min(100, Math.max(0, Math.round(countScore + posScore + page1Score)));
}

export function summaryPills(keywords: RankedKeyword[]): string[] {
  const pills: string[] = [];
  const totalVol = keywords.reduce((s, k) => s + k.search_volume, 0);
  const top3 = keywords.filter(k => k.rank_position <= 3).length;
  const top10 = keywords.filter(k => k.rank_position <= 10).length;

  if (top3 >= 3) pills.push("Strong Top-3 Rankings");
  else if (top10 >= 5) pills.push("Solid Page-1 Presence");
  if (totalVol >= 10_000) pills.push("High Organic Reach");
  else if (totalVol >= 1_000) pills.push("Growing Search Presence");
  return pills.slice(0, 4);
}

export function safeParseJSON<T>(text: string, fallback: T): T {
  const stripped = text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export function sanitizeDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}
