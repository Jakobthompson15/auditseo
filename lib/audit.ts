import type { BacklinkData, AIMetrics } from "./types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtCpc(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function computeSEOScore(backlinks: BacklinkData): number {
  // Domain authority rank (40 pts) — DataForSEO 0–100 scale
  const daScore = (backlinks.rank / 100) * 40;

  // Referring domains (30 pts) — log scale; 10,000 RDs = full score
  const rdScore =
    backlinks.referring_domains > 0
      ? Math.min(30, (Math.log10(backlinks.referring_domains) / Math.log10(10000)) * 30)
      : 0;

  // Dofollow quality ratio (20 pts)
  const total = backlinks.total_backlinks || 1;
  const dfRatio = backlinks.dofollow / total;
  const dfScore =
    backlinks.dofollow > 0
      ? dfRatio >= 0.7 ? 20 : dfRatio >= 0.5 ? 15 : dfRatio >= 0.3 ? 10 : 5
      : 0;

  // Spam score (10 pts) — inverse; lower spam = better
  const spamScore = Math.max(0, 10 - (backlinks.spam_score / 100) * 10);

  return Math.min(100, Math.max(0, Math.round(daScore + rdScore + dfScore + spamScore)));
}

export function computeAIScore(metrics: AIMetrics): number {
  // AI Mention Presence (40 pts) — log scale; 1,000 mentions = full score
  const mentionScore =
    metrics.total_mentions > 0
      ? Math.min(40, (Math.log10(metrics.total_mentions) / Math.log10(1000)) * 40)
      : 0;

  // AI Search Volume (35 pts) — log scale; 10,000 = full score
  const volumeScore =
    metrics.ai_search_volume > 0
      ? Math.min(35, (Math.log10(metrics.ai_search_volume) / Math.log10(10000)) * 35)
      : 0;

  // Answer authority ratio (25 pts)
  const totalCtx = metrics.question_mentions + metrics.answer_mentions;
  let ratioScore = 0;
  if (totalCtx > 0) {
    const ratio = metrics.answer_mentions / totalCtx;
    ratioScore = ratio >= 0.7 ? 25 : ratio >= 0.5 ? 18 : ratio >= 0.3 ? 12 : 6;
  }

  return Math.min(100, Math.max(0, Math.round(mentionScore + volumeScore + ratioScore)));
}

export function summaryPills(backlinks: BacklinkData, metrics: AIMetrics): string[] {
  const pills: string[] = [];
  if (backlinks.rank >= 70) pills.push("High Domain Authority");
  else if (backlinks.rank >= 40) pills.push("Growing Domain Authority");
  if (backlinks.referring_domains >= 500) pills.push("Strong Backlink Profile");
  const dfRatio = backlinks.dofollow / (backlinks.total_backlinks || 1);
  if (backlinks.dofollow > 0 && dfRatio > 0.6) pills.push("Quality Link Profile");
  if (backlinks.spam_score < 20) pills.push("Low Spam Score");
  if (metrics.total_mentions >= 100) pills.push("AI-Visible Brand");
  if (metrics.total_mentions < 10) pills.push("Grow AI Mentions");
  if (metrics.answer_mentions > metrics.question_mentions) pills.push("Authority in AI Answers");
  return pills.slice(0, 5);
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
