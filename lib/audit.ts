import type { AIMetrics } from "./types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtCpc(n: number): string {
  return `$${n.toFixed(2)}`;
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

export function summaryPills(metrics: AIMetrics): string[] {
  const pills: string[] = [];
  if (metrics.total_mentions >= 100) pills.push("AI-Visible Brand");
  if (metrics.total_mentions < 10) pills.push("Grow AI Mentions");
  if (metrics.answer_mentions > metrics.question_mentions) pills.push("Authority in AI Answers");
  if (metrics.ai_search_volume >= 1000) pills.push("High AI Search Volume");
  const totalCtx = metrics.question_mentions + metrics.answer_mentions;
  if (totalCtx > 0 && metrics.answer_mentions / totalCtx >= 0.7) pills.push("Strong Answer Presence");
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
