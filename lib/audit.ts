import type { RankData, BacklinkData, AIMetrics } from "./types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtCpc(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function computeSEOScore(
  rank: RankData,
  backlinks: BacklinkData
): number {
  // Domain Authority (30 pts)
  // DataForSEO's rank is already a logarithmic 0–100 scale derived from PageRank,
  // so mapping it linearly to 30 pts preserves its non-linear nature.
  const daScore = (backlinks.rank / 100) * 30;

  // Backlink Profile (25 pts)
  // Referring domains: logarithmic — going from 0→100 RDs matters more than 9,900→10,000.
  const rdScore =
    backlinks.referring_domains > 0
      ? Math.min(
          20,
          (Math.log10(backlinks.referring_domains) / Math.log10(10000)) * 20
        )
      : 0;
  // Dofollow quality ratio (5 pts): high dofollow % signals a natural, editorial link profile.
  const totalLinks = backlinks.total_backlinks || 1;
  const dfRatio = backlinks.dofollow / totalLinks;
  const dfScore =
    backlinks.dofollow > 0
      ? dfRatio >= 0.7
        ? 5
        : dfRatio >= 0.5
        ? 4
        : dfRatio >= 0.3
        ? 3
        : 1
      : 0;

  // Organic Traffic Value (25 pts)
  // ETV validates that authority translates to real traffic — a site with many backlinks
  // but zero traffic likely has a manipulated link profile (SEMrush Authority Score insight).
  const etvScore =
    rank.organic_etv > 0
      ? Math.min(
          25,
          (Math.log10(rank.organic_etv) / Math.log10(100000)) * 25
        )
      : 0;

  // CTR-Weighted Position Quality (20 pts)
  // Position multipliers reflect real click-through rates: pos 1–3 captures ~69% of all
  // clicks, pos 4–10 ~25%, pos 11–20 ~6%, pos 21–100 <1% (First Page Sage / Backlinko data).
  const weightedKw =
    rank.pos_1_3 * 5.0 +
    rank.pos_4_10 * 2.0 +
    rank.pos_11_20 * 0.5 +
    rank.pos_21_100 * 0.1;
  const posScore =
    weightedKw > 0
      ? Math.min(
          20,
          (Math.log10(weightedKw) / Math.log10(5000)) * 20
        )
      : 0;

  return Math.min(
    100,
    Math.max(0, Math.round(daScore + rdScore + dfScore + etvScore + posScore))
  );
}

export function computeAIScore(metrics: AIMetrics): number {
  // AI Mention Presence (40 pts) — logarithmic; 1,000 mentions = full score.
  const mentionScore =
    metrics.total_mentions > 0
      ? Math.min(
          40,
          (Math.log10(metrics.total_mentions) / Math.log10(1000)) * 40
        )
      : 0;

  // AI Search Volume (35 pts) — logarithmic; 10,000 = full score.
  const volumeScore =
    metrics.ai_search_volume > 0
      ? Math.min(
          35,
          (Math.log10(metrics.ai_search_volume) / Math.log10(10000)) * 35
        )
      : 0;

  // Answer Authority Ratio (25 pts)
  // Being cited in answers (vs. merely questioned about) signals the AI treats the brand
  // as an authoritative source, not just a topic of inquiry.
  const totalCtx = metrics.question_mentions + metrics.answer_mentions;
  let ratioScore = 0;
  if (totalCtx > 0) {
    const ratio = metrics.answer_mentions / totalCtx;
    ratioScore =
      ratio >= 0.7 ? 25 : ratio >= 0.5 ? 18 : ratio >= 0.3 ? 12 : 6;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(mentionScore + volumeScore + ratioScore))
  );
}

export function summaryPills(
  rank: RankData,
  backlinks: BacklinkData,
  metrics: AIMetrics
): string[] {
  const pills: string[] = [];
  if (backlinks.rank >= 70) pills.push("High Domain Authority");
  else if (backlinks.rank >= 40) pills.push("Growing Domain Authority");
  if (rank.pos_1_3 >= 20) pills.push("Strong Top Rankings");
  if (rank.organic_count >= 5000) pills.push("Broad Keyword Coverage");
  if (metrics.total_mentions >= 100) pills.push("AI-Visible Brand");
  if (metrics.total_mentions < 10) pills.push("Grow AI Mentions");
  if (metrics.answer_mentions > metrics.question_mentions)
    pills.push("Authority in AI Answers");
  if (
    backlinks.dofollow > 0 &&
    backlinks.dofollow / (backlinks.total_backlinks || 1) > 0.6
  )
    pills.push("Quality Backlink Profile");
  return pills.slice(0, 5);
}

export function safeParseJSON<T>(text: string, fallback: T): T {
  // Strip markdown code fences
  const stripped = text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // Try the whole stripped string first
  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Fallback: find first {...} or [...] block
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
