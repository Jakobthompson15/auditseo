import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  RankData,
  BacklinkData,
  KeywordItem,
  CompetitorItem,
  AIMetrics,
  AIKeywordItem,
  AuditContext,
} from "@/lib/types";
import { dfsPost, resolveLocationCode } from "@/lib/dataforseo";

// ── Rate limiting ──────────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitStore.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

// ── Competitor blocklist ───────────────────────────────────────────────────
const COMPETITOR_BLOCKLIST = new Set([
  "indeed.com", "linkedin.com", "ziprecruiter.com", "glassdoor.com",
  "monster.com", "careerbuilder.com", "simplyhired.com",
  "trustpilot.com", "yelp.com", "g2.com", "capterra.com", "bbb.org",
  "angi.com", "homeadvisor.com", "thumbtack.com", "bark.com",
  "facebook.com", "twitter.com", "x.com", "instagram.com",
  "youtube.com", "tiktok.com", "pinterest.com",
  "wikipedia.org", "reddit.com", "quora.com",
  "amazon.com", "ebay.com", "walmart.com", "etsy.com",
  "google.com", "bing.com", "yahoo.com",
  "houzz.com", "angieslist.com", "porch.com",
  "yellowpages.com", "whitepages.com", "manta.com",
]);

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_RANK: RankData = {
  organic_count: 0, paid_count: 0, organic_etv: 0, organic_traffic: 0,
  pos_1_3: 0, pos_4_10: 0, pos_11_20: 0, pos_21_100: 0,
};
const DEFAULT_BACKLINKS: BacklinkData = {
  total_backlinks: 0, referring_domains: 0, dofollow: 0,
  nofollow: 0, rank: 0, referring_ips: 0,
};
const DEFAULT_AI_METRICS: AIMetrics = {
  total_mentions: 0, ai_search_volume: 0,
  question_mentions: 0, answer_mentions: 0,
};

// ── Analysis prompt (Claude only — no DataForSEO) ─────────────────────────
function analysisPrompt(domain: string, context: Partial<AuditContext>): string {
  return `You are a senior digital marketing analyst. Here is the full audit data for "${domain}":

${JSON.stringify(context, null, 2)}

Return ONLY a valid JSON object with exactly these 3 fields (1-2 sentences each, no markdown):
{
  "seo": "<assess SEO authority — cite specific numbers: domain rank, organic keywords, top-3 rankings, referring domains>",
  "ai": "<evaluate AI/LLM visibility — cite total mentions, AI search volume, answer vs question ratio>",
  "recommendation": "<one concrete strategic recommendation tailored to this domain's specific strengths and gaps>"
}
No markdown, no explanation — only the JSON object.`;
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    const originHost = origin.replace(/^https?:\/\//, "").split(":")[0];
    const reqHost = host.split(":")[0];
    if (originHost !== reqHost && originHost !== "localhost") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again in an hour." },
      { status: 429 }
    );
  }

  let body: AuditRequest;
  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { domain, step, context = {}, city } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing or invalid domain" }, { status: 400 });
  }

  const validSteps: AuditStep[] = [
    "rank", "backlinks", "keywords", "competitors",
    "ai_metrics", "ai_keywords", "analysis",
  ];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  // Resolve location: country-level for Labs competitive analysis
  const locationCode = await resolveLocationCode(city ?? "");
  console.log(`[audit] domain=${domain} step=${step} city=${city ?? "—"} location_code=${locationCode}`);

  try {
    let data:
      | RankData | BacklinkData | KeywordItem[]
      | CompetitorItem[] | AIMetrics | AIKeywordItem[] | string;

    switch (step) {
      // ── STEP 1: Rank overview ─────────────────────────────────────────
      case "rank": {
        type BulkItem = {
          target?: string;
          metrics?: {
            organic?: {
              count?: number; etv?: number;
              pos_1?: number; pos_2_3?: number;
              pos_4_10?: number; pos_11_20?: number; pos_21_100?: number;
            };
            paid?: { count?: number; etv?: number };
          };
        };
        type BulkResult = Array<{ items?: BulkItem[] }>;

        const result = await dfsPost<BulkResult>(
          "/v3/dataforseo_labs/google/bulk_traffic_estimation/live",
          [{ targets: [domain], location_code: locationCode, language_code: "en" }]
        );

        const item = result[0]?.items?.[0];
        const org = item?.metrics?.organic ?? {};
        const paid = item?.metrics?.paid ?? {};

        data = {
          organic_count: org.count ?? 0,
          paid_count: paid.count ?? 0,
          organic_etv: org.etv ?? 0,
          organic_traffic: 0,
          pos_1_3: (org.pos_1 ?? 0) + (org.pos_2_3 ?? 0),
          pos_4_10: org.pos_4_10 ?? 0,
          pos_11_20: org.pos_11_20 ?? 0,
          pos_21_100: org.pos_21_100 ?? 0,
        } satisfies RankData;
        console.log(`[rank] organic_count=${(data as RankData).organic_count} etv=${(data as RankData).organic_etv} pos_1_3=${(data as RankData).pos_1_3}`);
        break;
      }

      // ── STEP 2: Backlink profile ──────────────────────────────────────
      case "backlinks": {
        type BacklinksItem = {
          rank?: number;
          backlinks?: number;
          referring_domains?: number;
          referring_ips?: number;
          referring_links_attributes?: { dofollow?: number; nofollow?: number };
        };
        type BacklinksResult = BacklinksItem[];

        const result = await dfsPost<BacklinksResult>(
          "/v3/backlinks/summary/live",
          [{ target: domain, include_subdomains: true }]
        );

        const r = result[0] ?? {};
        const attrs = r.referring_links_attributes ?? {};
        const total = r.backlinks ?? 0;
        const nofollow = attrs.nofollow ?? 0;
        const dofollow = attrs.dofollow ?? Math.max(0, total - nofollow);

        data = {
          total_backlinks: total,
          referring_domains: r.referring_domains ?? 0,
          dofollow,
          nofollow,
          rank: r.rank ?? 0,
          referring_ips: r.referring_ips ?? 0,
        } satisfies BacklinkData;
        console.log(`[backlinks] total=${total} domains=${(data as BacklinkData).referring_domains} rank=${(data as BacklinkData).rank} dofollow=${dofollow}`);
        break;
      }

      // ── STEP 3: Ranked keywords ───────────────────────────────────────
      case "keywords": {
        type KwItem = {
          keyword_data?: {
            keyword?: string;
            keyword_info?: { search_volume?: number; cpc?: number };
          };
          ranked_serp_element?: {
            serp_item?: { rank_group?: number };
          };
        };
        type KwResult = Array<{ items?: KwItem[]; total_count?: number }>;

        const result = await dfsPost<KwResult>(
          "/v3/dataforseo_labs/google/ranked_keywords/live",
          [{
            target: domain,
            location_code: locationCode,
            language_code: "en",
            limit: 100,
            filters: ["keyword_data.keyword_info.search_volume", ">", 0],
            order_by: ["keyword_data.keyword_info.search_volume,desc"],
          }]
        );

        const items = result[0]?.items ?? [];
        const mapped = items
          .map(item => {
            const pos = item.ranked_serp_element?.serp_item?.rank_group ?? 0;
            return {
              keyword: item.keyword_data?.keyword ?? "",
              rank: pos,
              search_volume: item.keyword_data?.keyword_info?.search_volume ?? 0,
              cpc: item.keyword_data?.keyword_info?.cpc ?? 0,
              opportunity: pos >= 11 && pos <= 20,
            };
          })
          .filter(k => k.keyword && k.rank > 0);

        const top6 = mapped.filter(k => k.rank >= 1 && k.rank <= 10).slice(0, 6);
        const opps = mapped.filter(k => k.rank >= 11 && k.rank <= 20).slice(0, 4);
        data = [...top6, ...opps] as KeywordItem[];
        console.log(`[keywords] total_mapped=${mapped.length} top=${top6.length} opportunities=${opps.length}`);
        break;
      }

      // ── STEP 4: Direct competitors ────────────────────────────────────
      case "competitors": {
        type CompItem = {
          domain?: string;
          intersections?: number;
          full_domain_metrics?: {
            organic?: { count?: number; etv?: number };
          };
        };
        type CompResult = Array<{ items?: CompItem[] }>;

        const result = await dfsPost<CompResult>(
          "/v3/dataforseo_labs/google/competitors_domain/live",
          [{
            target: domain,
            location_code: locationCode,
            language_code: "en",
            limit: 20,
          }]
        );

        const items = result[0]?.items ?? [];
        const lowerDomain = domain.toLowerCase();

        const filtered: CompetitorItem[] = items
          .filter(c => {
            const d = (c.domain ?? "").toLowerCase();
            return d && d !== lowerDomain && !COMPETITOR_BLOCKLIST.has(d);
          })
          .slice(0, 5)
          .map(c => ({
            domain: c.domain ?? "",
            organic_count: c.full_domain_metrics?.organic?.count ?? 0,
            organic_etv: c.full_domain_metrics?.organic?.etv ?? 0,
            rank: 0,
          }));

        data = filtered;
        console.log(`[competitors] returned=${filtered.length} domains=${filtered.map(c => c.domain).join(", ")}`);
        break;
      }

      // ── STEP 5: AI mention metrics ────────────────────────────────────
      case "ai_metrics": {
        type AIMetricsResult = Array<{
          total_mentions?: number;
          ai_search_volume?: number;
          question_mentions?: number;
          answer_mentions?: number;
        }>;

        let r: AIMetricsResult[0] = {};
        try {
          const result = await dfsPost<AIMetricsResult>(
            "/v3/ai_optimization/llm_mentions/aggregated_metrics/live",
            [{ target: [domain] }]
          );
          r = result[0] ?? {};
        } catch (err) {
          console.warn("[ai_metrics] failed:", err instanceof Error ? err.message : err);
        }

        data = {
          total_mentions: r.total_mentions ?? 0,
          ai_search_volume: r.ai_search_volume ?? 0,
          question_mentions: r.question_mentions ?? 0,
          answer_mentions: r.answer_mentions ?? 0,
        } satisfies AIMetrics;
        console.log(`[ai_metrics] mentions=${(data as AIMetrics).total_mentions} ai_vol=${(data as AIMetrics).ai_search_volume}`);
        break;
      }

      // ── STEP 6: AI mention queries ────────────────────────────────────
      case "ai_keywords": {
        type AIKwResult = Array<{
          items?: Array<{
            keyword?: string;
            total_count?: number;
            ai_search_volume?: number;
          }>;
        }>;

        let items: NonNullable<AIKwResult[0]["items"]> = [];
        try {
          const result = await dfsPost<AIKwResult>(
            "/v3/ai_optimization/llm_mentions/search/live",
            [{ target: [domain], limit: 6, order_by: ["total_count,desc"] }]
          );
          items = result[0]?.items ?? [];
        } catch (err) {
          console.warn("[ai_keywords] failed:", err instanceof Error ? err.message : err);
        }

        data = items.map(k => ({
          keyword: k.keyword ?? "",
          total_count: k.total_count ?? 0,
          ai_search_volume: k.ai_search_volume ?? 0,
        })) satisfies AIKeywordItem[];
        console.log(`[ai_keywords] queries=${items.length}`);
        break;
      }

      // ── STEP 7: Analysis (Claude direct — no DataForSEO) ─────────────
      case "analysis": {
        console.log(`[analysis] calling Claude for ${domain}`);
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{ role: "user", content: analysisPrompt(domain, context) }],
        });
        const textBlock = response.content.find(b => b.type === "text");
        const text = textBlock?.type === "text" ? textBlock.text.trim() : "";
        data = text || "Analysis could not be generated. Please retry.";
        console.log(`[analysis] done tokens_used=${response.usage.output_tokens}`);
        break;
      }
    }

    return NextResponse.json({ step, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error(`[audit] step=${step} error:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

