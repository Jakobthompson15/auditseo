import type { RankedKeyword, ContentMention } from "./types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtCpc(n: number): string {
  return `$${n.toFixed(2)}`;
}

// SEO Score: based on ranked keywords count, positions, and total search volume
export function computeSEOScore(keywords: RankedKeyword[]): number {
  if (keywords.length === 0) return 0;

  // Keyword count (30 pts) — log scale; 200 keywords = full score
  const countScore = Math.min(30, (Math.log10(keywords.length) / Math.log10(200)) * 30);

  // Average position of top 10 by volume (40 pts) — position 1 = 40, position 50 = 0
  const top10 = [...keywords].sort((a, b) => b.search_volume - a.search_volume).slice(0, 10);
  const avgPos = top10.reduce((s, k) => s + k.rank_position, 0) / top10.length;
  const posScore = Math.max(0, 40 - (avgPos / 50) * 40);

  // Total search volume (30 pts) — log scale; 100,000 = full score
  const totalVol = keywords.reduce((s, k) => s + k.search_volume, 0);
  const volScore = totalVol > 0
    ? Math.min(30, (Math.log10(totalVol) / Math.log10(100_000)) * 30)
    : 0;

  return Math.min(100, Math.max(0, Math.round(countScore + posScore + volScore)));
}

// Brand Score: based on mention count and sentiment
export function computeBrandScore(mentions: ContentMention[]): number {
  if (mentions.length === 0) return 0;

  // Mention count (60 pts) — log scale; 50 mentions = full score
  const countScore = Math.min(60, (Math.log10(mentions.length) / Math.log10(50)) * 60);

  // Positive sentiment ratio (40 pts)
  const positive = mentions.filter(m => m.sentiment === "positive").length;
  const sentimentScore = mentions.length > 0 ? (positive / mentions.length) * 40 : 0;

  return Math.min(100, Math.max(0, Math.round(countScore + sentimentScore)));
}

export function summaryPills(keywords: RankedKeyword[], mentions: ContentMention[]): string[] {
  const pills: string[] = [];
  const totalVol = keywords.reduce((s, k) => s + k.search_volume, 0);
  const top3 = keywords.filter(k => k.rank_position <= 3).length;
  const top10 = keywords.filter(k => k.rank_position <= 10).length;

  if (top3 >= 5) pills.push("Strong Top-3 Rankings");
  else if (top10 >= 10) pills.push("Solid Page-1 Presence");
  if (totalVol >= 10_000) pills.push("High Organic Reach");
  if (mentions.length >= 20) pills.push("Active Brand Mentions");
  if (mentions.length < 5) pills.push("Grow Brand Presence");
  const positiveMentions = mentions.filter(m => m.sentiment === "positive").length;
  if (positiveMentions > 0 && positiveMentions / mentions.length >= 0.7) pills.push("Positive Sentiment");
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

// Derive a seed keyword from a domain name for keyword suggestions
export function seedFromDomain(domain: string): string {
  return domain
    .replace(/\.(com|net|org|co|io|biz|info|us|ca|au)(\..+)?$/i, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}
