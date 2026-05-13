import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  RankedKeyword,
  OpportunityKeyword,
  ContentMention,
  AuditContext,
} from "@/lib/types";
import { dfsPost, resolveLocationCode } from "@/lib/dataforseo";
import { seedFromDomain } from "@/lib/audit";

// ── Analysis prompt ────────────────────────────────────────────────────────
function analysisPrompt(domain: string, context: Partial<AuditContext>): string {
  const rankedCount = context.ranked_keywords?.length ?? 0;
  const topKeywords = (context.ranked_keywords ?? [])
    .slice(0, 5)
    .map(k => `${k.keyword} (pos ${k.rank_position}, vol ${k.search_volume})`)
    .join(", ");
  const oppCount = context.opportunity_keywords?.length ?? 0;
  const topOpps = (context.opportunity_keywords ?? [])
    .slice(0, 5)
    .map(k => `${k.keyword} (vol ${k.search_volume}, ${k.intent})`)
    .join(", ");
  const mentionCount = context.content_analysis?.length ?? 0;

  return `You are a senior digital marketing analyst reviewing "${domain}".

Ranking data: ${rankedCount} keywords found. Top keywords: ${topKeywords || "none"}
Opportunity keywords: ${oppCount} found. Top opportunities: ${topOpps || "none"}
Brand mentions: ${mentionCount} mentions found across the web.

Return ONLY a valid JSON object with exactly these 3 fields (1-2 sentences each, no markdown):
{
  "seo": "<assess current organic search presence — cite specific keywords, positions, and search volume>",
  "ai": "<evaluate brand visibility and mention presence across the web — cite mention count and sentiment>",
  "recommendation": "<one concrete action this business should take to improve search visibility and brand presence>"
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
  const city = body.city ?? "";

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing or invalid domain" }, { status: 400 });
  }

  const validSteps: AuditStep[] = ["ranked_keywords", "opportunity_keywords", "content_analysis", "analysis"];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  console.log(`[audit] domain=${domain} step=${step}`);

  try {
    let data: RankedKeyword[] | OpportunityKeyword[] | ContentMention[] | string;

    switch (step) {
      // ── STEP 1: Keywords the domain already ranks for ─────────────────
      case "ranked_keywords": {
        type RankedResult = Array<{
          items?: Array<Record<string, unknown>>;
        }>;

        const locationCode = await resolveLocationCode(city);
        const result = await dfsPost<RankedResult>(
          "/v3/dataforseo_labs/google/ranked_keywords/live",
          [{
            target: domain,
            location_code: locationCode,
            language_code: "en",
            limit: 50,
          }]
        );

        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[ranked_keywords] first item keys:", Object.keys(items[0]));
          console.log("[ranked_keywords] first item:", JSON.stringify(items[0]).slice(0, 500));
        }

        data = items.map(item => {
          const kd = (item.keyword_data ?? {}) as Record<string, unknown>;
          const info = (kd.keyword_info ?? {}) as Record<string, unknown>;
          const props = (kd.keyword_properties ?? {}) as Record<string, unknown>;
          const intent = (kd.search_intent_info ?? {}) as Record<string, unknown>;
          const serp = (item.ranked_serp_element ?? {}) as Record<string, unknown>;
          const serpItem = ((serp.serp_item ?? {}) as Record<string, unknown>);

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

      // ── STEP 2: Opportunity keywords the domain should rank for ───────
      case "opportunity_keywords": {
        type SuggestResult = Array<{
          items?: Array<Record<string, unknown>>;
        }>;

        // Use top ranked keyword as seed, fall back to domain-derived seed
        const topRanked = context.ranked_keywords?.[0]?.keyword;
        const seed = topRanked ?? seedFromDomain(domain);
        console.log(`[opportunity_keywords] seed="${seed}"`);

        const locationCode = await resolveLocationCode(city);
        const result = await dfsPost<SuggestResult>(
          "/v3/dataforseo_labs/google/keyword_suggestions/live",
          [{
            keyword: seed,
            location_code: locationCode,
            language_code: "en",
            limit: 30,
            include_serp_info: false,
          }]
        );

        const items = result[0]?.items ?? [];
        if (items.length > 0) {
          console.log("[opportunity_keywords] first item:", JSON.stringify(items[0]).slice(0, 500));
        }

        // Filter out keywords the domain already ranks well for
        const alreadyRanking = new Set(
          (context.ranked_keywords ?? [])
            .filter(k => k.rank_position <= 10)
            .map(k => k.keyword.toLowerCase())
        );

        data = items.map(item => {
          const kd = (item.keyword_data ?? {}) as Record<string, unknown>;
          const info = (kd.keyword_info ?? {}) as Record<string, unknown>;
          const intent = (kd.search_intent_info ?? {}) as Record<string, unknown>;

          return {
            keyword: (kd.keyword as string) ?? "",
            search_volume: (info.search_volume as number) ?? 0,
            cpc: (info.cpc as number) ?? 0,
            intent: (intent.main_intent as string) ?? "informational",
            competition: (info.competition as number) ?? 0,
          } satisfies OpportunityKeyword;
        }).filter(k => k.keyword !== "" && !alreadyRanking.has(k.keyword.toLowerCase()))
          .sort((a, b) => b.search_volume - a.search_volume)
          .slice(0, 15);

        console.log(`[opportunity_keywords] total=${items.length} returned=${(data as OpportunityKeyword[]).length}`);
        break;
      }

      // ── STEP 3: Brand/content mentions ───────────────────────────────
      case "content_analysis": {
        type MentionResult = Array<{
          items?: Array<Record<string, unknown>>;
        }>;

        let items: Array<Record<string, unknown>> = [];
        try {
          const result = await dfsPost<MentionResult>(
            "/v3/content_analysis/search/live",
            [{
              keyword: domain,
              limit: 10,
            }]
          );
          items = result[0]?.items ?? [];
          if (items.length > 0) {
            console.log("[content_analysis] first item:", JSON.stringify(items[0]).slice(0, 500));
          }
        } catch (err) {
          console.warn("[content_analysis] failed:", err instanceof Error ? err.message : err);
        }

        data = items.map(item => {
          const sentimentRaw = (item.sentiment_connotations ?? {}) as Record<string, number>;
          const pos = sentimentRaw.positive ?? 0;
          const neg = sentimentRaw.negative ?? 0;
          const sentiment: ContentMention["sentiment"] =
            pos > neg + 0.2 ? "positive" : neg > pos + 0.2 ? "negative" : "neutral";

          const textStructure = (item.text_structure ?? {}) as Record<string, unknown>;
          const snippets = textStructure.snippets as string[] | undefined;
          const snippet = snippets?.[0] ?? "";

          return {
            title: (item.title as string) ?? "",
            url: (item.url as string) ?? "",
            domain: (item.main_domain as string) ?? "",
            date: ((item.date_published as string) ?? "").slice(0, 10),
            snippet: snippet.slice(0, 200),
            sentiment,
          } satisfies ContentMention;
        }).filter(m => m.url !== "");

        console.log(`[content_analysis] mentions=${(data as ContentMention[]).length}`);
        break;
      }

      // ── STEP 4: Claude analysis ───────────────────────────────────────
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
