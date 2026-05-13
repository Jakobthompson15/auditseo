import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  DomainRankOverview,
  RankedKeyword,
  KeywordForSite,
  SerpCompetitor,
  IntersectionKeyword,
  AuditContext,
} from "@/lib/types";
import { dfsPost, resolveLocationCode } from "@/lib/dataforseo";

const VALID_STEPS: AuditStep[] = [
  "domain_rank_overview",
  "ranked_keywords",
  "keywords_for_site",
  "serp_competitors",
  "domain_intersection",
  "analysis",
];

function analysisPrompt(domain: string, ctx: Partial<AuditContext>): string {
  const ov = ctx.domain_rank_overview;
  const overviewLine = ov
    ? `Overview: ${ov.organic_keywords} organic keywords. Top-3 positions: ${ov.pos_1_3}, positions 4-10: ${ov.pos_4_10}, page 2 (11-20): ${ov.pos_11_20}.`
    : "";

  const topRanked = (ctx.ranked_keywords ?? []).slice(0, 5)
    .map(k => `${k.keyword} (pos ${k.rank_position}, vol ${k.search_volume})`).join(", ");
  const topOpp = (ctx.keywords_for_site ?? []).slice(0, 5)
    .map(k => `${k.keyword} (vol ${k.search_volume})`).join(", ");
  const topComp = (ctx.serp_competitors ?? []).slice(0, 5)
    .map(c => `${c.domain} (${c.keywords_count} shared keywords)`).join(", ");
  const topInter = (ctx.domain_intersection ?? []).slice(0, 5)
    .map(k => `${k.keyword} (us: pos ${k.our_position}, them: pos ${k.competitor_position})`).join(", ");

  return `You are a senior digital marketing analyst reviewing "${domain}".

${overviewLine}
Current rankings: ${topRanked || "none found"}.
Keyword opportunities: ${topOpp || "none found"}.
Top competitors: ${topComp || "none found"}.
Keyword gaps vs top competitor: ${topInter || "none found"}.

Return ONLY a valid JSON object with exactly these 3 fields (1-2 sentences each, no markdown):
{
  "seo": "<assess current organic search presence — cite specific keywords, positions, and traffic potential>",
  "competition": "<evaluate the competitive landscape — cite top competitor domains and keyword overlap opportunities>",
  "recommendation": "<one high-impact action this business should take to improve rankings and outrank competitors>"
}
No markdown, no explanation — only the JSON object.`;
}

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

  let body: AuditRequest;
  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { domain, step, context = {} } = body;
  const city = body.city ?? "";

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing or invalid domain" }, { status: 400 });
  }
  if (!VALID_STEPS.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  console.log(`[audit] domain=${domain} step=${step}`);

  try {
    let data: DomainRankOverview | RankedKeyword[] | KeywordForSite[] | SerpCompetitor[] | IntersectionKeyword[] | string;

    switch (step) {
      // ── STEP 1: Domain overview ────────────────────────────────────────
      case "domain_rank_overview": {
        type OverviewResult = Array<{ items?: Array<Record<string, unknown>> }>;
        const locationCode = await resolveLocationCode(city, true);
        const result = await dfsPost<OverviewResult>(
          "/v3/dataforseo_labs/google/domain_rank_overview/live",
          [{ target: domain, location_code: locationCode, language_code: "en" }]
        );
        const item = (result[0]?.items?.[0] ?? {}) as Record<string, unknown>;
        if (result[0]?.items?.length) {
          console.log("[domain_rank_overview] item keys:", Object.keys(item));
          console.log("[domain_rank_overview] item:", JSON.stringify(item).slice(0, 500));
        }
        const metrics = (item.metrics ?? {}) as Record<string, unknown>;
        const organic = (metrics.organic ?? {}) as Record<string, unknown>;

        data = {
          organic_keywords: (organic.count as number) ?? 0,
          organic_traffic: (organic.etv as number) ?? 0,
          pos_1_3: ((organic.pos_1 as number) ?? 0) + ((organic.pos_2_3 as number) ?? 0),
          pos_4_10: (organic.pos_4_10 as number) ?? 0,
          pos_11_20: (organic.pos_11_20 as number) ?? 0,
          pos_21_100:
            ((organic.pos_21_30 as number) ?? 0) +
            ((organic.pos_31_40 as number) ?? 0) +
            ((organic.pos_41_50 as number) ?? 0) +
            ((organic.pos_51_60 as number) ?? 0) +
            ((organic.pos_61_70 as number) ?? 0) +
            ((organic.pos_71_80 as number) ?? 0) +
            ((organic.pos_81_90 as number) ?? 0) +
            ((organic.pos_91_100 as number) ?? 0),
        } satisfies DomainRankOverview;

        console.log(`[domain_rank_overview] organic_keywords=${(data as DomainRankOverview).organic_keywords}`);
        break;
      }

      // ── STEP 2: Keywords the domain ranks for ─────────────────────────
      case "ranked_keywords": {
        type RankedResult = Array<{ items?: Array<Record<string, unknown>> }>;
        const locationCode = await resolveLocationCode(city, true);
        console.log(`[ranked_keywords] location_code=${locationCode} city="${city}"`);
        const result = await dfsPost<RankedResult>(
          "/v3/dataforseo_labs/google/ranked_keywords/live",
          [{ target: domain, location_code: locationCode, language_code: "en", limit: 50 }]
        );
        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[ranked_keywords] first item:", JSON.stringify(items[0]).slice(0, 500));
        }
        data = items.map(item => {
          const kd = (item.keyword_data ?? {}) as Record<string, unknown>;
          const info = (kd.keyword_info ?? {}) as Record<string, unknown>;
          const intent = (kd.search_intent_info ?? {}) as Record<string, unknown>;
          const serp = (item.ranked_serp_element ?? {}) as Record<string, unknown>;
          const serpItem = (serp.serp_item ?? {}) as Record<string, unknown>;
          return {
            keyword: (kd.keyword as string) ?? "",
            search_volume: (info.search_volume as number) ?? 0,
            rank_position: (serpItem.rank_group as number) ?? 0,
            cpc: (info.cpc as number) ?? 0,
            intent: (intent.main_intent as string) ?? "informational",
          } satisfies RankedKeyword;
        }).filter(k => k.keyword !== "")
          .sort((a, b) => b.search_volume - a.search_volume)
          .slice(0, 20);
        console.log(`[ranked_keywords] total=${items.length} returned=${(data as RankedKeyword[]).length}`);
        break;
      }

      // ── STEP 3: Keyword opportunities for this domain ─────────────────
      case "keywords_for_site": {
        type KwSiteResult = Array<{ items?: Array<Record<string, unknown>> }>;
        const locationCode = await resolveLocationCode(city, true);
        const result = await dfsPost<KwSiteResult>(
          "/v3/dataforseo_labs/google/keywords_for_site/live",
          [{ target: domain, location_code: locationCode, language_code: "en", limit: 50 }]
        );
        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[keywords_for_site] first item:", JSON.stringify(items[0]).slice(0, 500));
        }
        const alreadyRanking = new Set(
          (context.ranked_keywords ?? [])
            .filter(k => k.rank_position <= 10)
            .map(k => k.keyword.toLowerCase())
        );
        data = items.map(item => {
          // keywords_for_site items can be flat or nested under keyword_data
          const kd = (item.keyword_data ?? item) as Record<string, unknown>;
          const info = (kd.keyword_info ?? {}) as Record<string, unknown>;
          return {
            keyword: (kd.keyword as string) ?? (item.keyword as string) ?? "",
            search_volume: (info.search_volume as number) ?? (item.search_volume as number) ?? 0,
            cpc: (info.cpc as number) ?? (item.cpc as number) ?? 0,
            competition: (info.competition as number) ?? (item.competition as number) ?? 0,
          } satisfies KeywordForSite;
        }).filter(k => k.keyword !== "" && !alreadyRanking.has(k.keyword.toLowerCase()))
          .sort((a, b) => b.search_volume - a.search_volume)
          .slice(0, 20);
        console.log(`[keywords_for_site] total=${items.length} returned=${(data as KeywordForSite[]).length}`);
        break;
      }

      // ── STEP 4: Organic competitors ───────────────────────────────────
      case "serp_competitors": {
        type CompResult = Array<{ items?: Array<Record<string, unknown>> }>;
        const locationCode = await resolveLocationCode(city);
        const result = await dfsPost<CompResult>(
          "/v3/dataforseo_labs/google/competitors_domain/live",
          [{ target: domain, location_code: locationCode, language_code: "en", limit: 10 }]
        );
        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[serp_competitors] first item:", JSON.stringify(items[0]).slice(0, 500));
        }
        data = items.map(item => {
          const fdm = (item.full_domain_metrics ?? {}) as Record<string, unknown>;
          const organic = (fdm.organic ?? {}) as Record<string, unknown>;
          const avgPos = (item.avg_position as number) ?? 50;
          return {
            domain: (item.domain as string) ?? "",
            avg_position: avgPos,
            keywords_count: (item.intersections as number) ?? 0,
            etv: (organic.etv as number) ?? 0,
            visibility: Math.max(0, Math.min(100, Math.round(100 - avgPos))),
          } satisfies SerpCompetitor;
        }).filter(c => c.domain !== "")
          .slice(0, 10);
        console.log(`[serp_competitors] count=${(data as SerpCompetitor[]).length}`);
        break;
      }

      // ── STEP 5: Keyword intersection with top competitor ──────────────
      case "domain_intersection": {
        const topCompetitor = context.serp_competitors?.[0]?.domain;
        if (!topCompetitor) {
          data = [] as IntersectionKeyword[];
          break;
        }
        type IntersResult = Array<{ items?: Array<Record<string, unknown>> }>;
        const locationCode = await resolveLocationCode(city);
        const result = await dfsPost<IntersResult>(
          "/v3/dataforseo_labs/google/domain_intersection/live",
          [{
            target1: domain,
            target2: topCompetitor,
            location_code: locationCode,
            language_code: "en",
            limit: 20,
          }]
        );
        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[domain_intersection] first item:", JSON.stringify(items[0]).slice(0, 500));
        }
        data = items.map(item => {
          const kd = (item.keyword_data ?? {}) as Record<string, unknown>;
          const info = (kd.keyword_info ?? {}) as Record<string, unknown>;
          const first = (item.first_domain_serp_element ?? {}) as Record<string, unknown>;
          const firstItem = (first.serp_item ?? {}) as Record<string, unknown>;
          const second = (item.second_domain_serp_element ?? {}) as Record<string, unknown>;
          const secondItem = (second.serp_item ?? {}) as Record<string, unknown>;
          return {
            keyword: (kd.keyword as string) ?? "",
            search_volume: (info.search_volume as number) ?? 0,
            our_position: (firstItem.rank_group as number) ?? 0,
            competitor_position: (secondItem.rank_group as number) ?? 0,
            cpc: (info.cpc as number) ?? 0,
          } satisfies IntersectionKeyword;
        }).filter(k => k.keyword !== "")
          .sort((a, b) => b.search_volume - a.search_volume)
          .slice(0, 15);
        console.log(`[domain_intersection] count=${(data as IntersectionKeyword[]).length}`);
        break;
      }

      // ── STEP 6: Claude analysis ───────────────────────────────────────
      case "analysis": {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{ role: "user", content: analysisPrompt(domain, context) }],
        });
        const textBlock = response.content.find(b => b.type === "text");
        data = (textBlock?.type === "text" ? textBlock.text.trim() : "") || "Analysis could not be generated. Please retry.";
        console.log(`[analysis] done tokens=${response.usage.output_tokens}`);
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
