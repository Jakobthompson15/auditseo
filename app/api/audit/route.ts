import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  AIMetrics,
  AIKeywordItem,
  KeywordOpportunity,
  CompetitorDomain,
  AuditContext,
} from "@/lib/types";
import { dfsPost, resolveLocationCode } from "@/lib/dataforseo";

// ── Analysis prompt ────────────────────────────────────────────────────────
function analysisPrompt(domain: string, context: Partial<AuditContext>): string {
  return `You are a senior digital marketing analyst. Here is the full audit data for "${domain}":

${JSON.stringify(context, null, 2)}

Return ONLY a valid JSON object with exactly these 3 fields (1-2 sentences each, no markdown):
{
  "seo": "<assess organic search presence — cite top keyword opportunities, search volume, difficulty, and any quick-win positions 11-20>",
  "ai": "<evaluate AI/LLM visibility — cite total mentions, AI search volume, answer vs question ratio>",
  "recommendation": "<one concrete strategic recommendation based on the keyword gaps and AI visibility data for this specific domain>"
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

  let body: AuditRequest;
  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { domain, step, context = {} } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing or invalid domain" }, { status: 400 });
  }

  const validSteps: AuditStep[] = ["ai_metrics", "ai_keywords", "keywords", "competitors", "analysis"];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  console.log(`[audit] domain=${domain} step=${step}`);

  const city = body.city ?? "";

  try {
    let data: AIMetrics | AIKeywordItem[] | KeywordOpportunity[] | CompetitorDomain[] | string;

    switch (step) {
      // ── STEP 1: AI mention metrics ────────────────────────────────────
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
        console.log(`[ai_metrics] mentions=${(data as AIMetrics).total_mentions} vol=${(data as AIMetrics).ai_search_volume}`);
        break;
      }

      // ── STEP 2: AI mention queries ────────────────────────────────────
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

      // ── STEP 3: SERP keyword opportunities (Labs) ────────────────────
      case "keywords": {
        type KwForSiteResult = Array<{
          items?: Array<{
            keyword_data?: {
              keyword?: string;
              keyword_info?: { search_volume?: number; cpc?: number };
              keyword_properties?: { keyword_difficulty?: number };
              search_intent_info?: { main_intent?: string };
            };
            ranked_serp_element?: { serp_item?: { rank_group?: number } };
          }>;
        }>;

        let items: NonNullable<KwForSiteResult[0]["items"]> = [];
        try {
          const locationCode = await resolveLocationCode(city);
          const result = await dfsPost<KwForSiteResult>(
            "/v3/dataforseo_labs/google/keywords_for_site/live",
            [{
              target: domain,
              location_code: locationCode,
              language_code: "en",
              include_serp_info: true,
              include_subdomains: true,
              limit: 50,
            }]
          );
          items = result[0]?.items ?? [];
        } catch (err) {
          console.warn("[keywords] failed:", err instanceof Error ? err.message : err);
        }

        // Compute opportunity scores and sort
        const scored = items.map(item => {
          const kd = item.keyword_data ?? {};
          const info = kd.keyword_info ?? {};
          const vol = info.search_volume ?? 0;
          const cpc = info.cpc ?? 0;
          const diff = kd.keyword_properties?.keyword_difficulty ?? 50;
          const intent = kd.search_intent_info?.main_intent ?? "informational";
          const pos = item.ranked_serp_element?.serp_item?.rank_group;

          let score = vol / (diff + 1);
          if (intent === "commercial" || intent === "transactional") score *= 1.5;
          if (pos !== undefined && pos >= 11 && pos <= 20) score *= 2;
          else if (pos !== undefined && pos >= 21 && pos <= 50) score *= 1.5;

          return {
            keyword: kd.keyword ?? "",
            search_volume: vol,
            cpc,
            keyword_difficulty: diff,
            intent,
            opportunity_score: Math.round(score),
            rank_position: pos,
          } satisfies KeywordOpportunity;
        });

        scored.sort((a, b) => b.opportunity_score - a.opportunity_score);
        data = scored.slice(0, 12);
        console.log(`[keywords] total=${items.length} returned=${(data as KeywordOpportunity[]).length}`);
        break;
      }

      // ── STEP 4: Competitor domains (Labs) ────────────────────────────
      case "competitors": {
        type CompetitorsResult = Array<{
          items?: Array<{
            domain?: string;
            avg_position?: number;
            sum_position?: number;
            intersections?: number;
            full_domain_metrics?: {
              organic?: { etv?: number; keywords_count?: number };
            };
          }>;
        }>;

        let items: NonNullable<CompetitorsResult[0]["items"]> = [];
        try {
          const locationCode = await resolveLocationCode(city);
          const result = await dfsPost<CompetitorsResult>(
            "/v3/dataforseo_labs/google/competitors_domain/live",
            [{
              target: domain,
              location_code: locationCode,
              language_code: "en",
              limit: 8,
            }]
          );
          items = result[0]?.items ?? [];
        } catch (err) {
          console.warn("[competitors] failed:", err instanceof Error ? err.message : err);
        }

        data = items.map(c => ({
          domain: c.domain ?? "",
          avg_position: Math.round((c.avg_position ?? 0) * 10) / 10,
          intersections: c.intersections ?? 0,
          etv: c.full_domain_metrics?.organic?.etv ?? 0,
          keywords_count: c.full_domain_metrics?.organic?.keywords_count ?? 0,
        })) satisfies CompetitorDomain[];
        console.log(`[competitors] count=${(data as CompetitorDomain[]).length}`);
        break;
      }

      // ── STEP 5: Analysis (Claude) ─────────────────────────────────────
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
