import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  BacklinkData,
  AIMetrics,
  AIKeywordItem,
  AuditContext,
} from "@/lib/types";
import { dfsPost } from "@/lib/dataforseo";

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_BACKLINKS: BacklinkData = {
  rank: 0, total_backlinks: 0, referring_domains: 0, referring_ips: 0,
  referring_pages: 0, broken_backlinks: 0, broken_pages: 0, spam_score: 0,
  dofollow: 0, nofollow: 0, ugc: 0, sponsored: 0,
  link_types: {}, link_locations: {},
};

// ── Analysis prompt ────────────────────────────────────────────────────────
function analysisPrompt(domain: string, context: Partial<AuditContext>): string {
  return `You are a senior digital marketing analyst. Here is the full audit data for "${domain}":

${JSON.stringify(context, null, 2)}

Return ONLY a valid JSON object with exactly these 3 fields (1-2 sentences each, no markdown):
{
  "seo": "<assess backlink authority — cite rank, referring domains, dofollow ratio, spam score>",
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

  const validSteps: AuditStep[] = ["backlinks", "ai_metrics", "ai_keywords", "analysis"];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  console.log(`[audit] domain=${domain} step=${step}`);

  try {
    let data: BacklinkData | AIMetrics | AIKeywordItem[] | string;

    switch (step) {
      // ── STEP 1: Backlink profile ──────────────────────────────────────
      case "backlinks": {
        type BacklinksItem = {
          rank?: number;
          backlinks?: number;
          referring_domains?: number;
          referring_ips?: number;
          referring_pages?: number;
          broken_backlinks?: number;
          broken_pages?: number;
          backlinks_spam_score?: number;
          referring_links_attributes?: {
            dofollow?: number;
            nofollow?: number;
            ugc?: number;
            sponsored?: number;
          };
          referring_links_types?: Record<string, number>;
          referring_links_semantic_locations?: Record<string, number>;
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
          rank: r.rank ?? 0,
          total_backlinks: total,
          referring_domains: r.referring_domains ?? 0,
          referring_ips: r.referring_ips ?? 0,
          referring_pages: r.referring_pages ?? 0,
          broken_backlinks: r.broken_backlinks ?? 0,
          broken_pages: r.broken_pages ?? 0,
          spam_score: r.backlinks_spam_score ?? 0,
          dofollow,
          nofollow,
          ugc: attrs.ugc ?? 0,
          sponsored: attrs.sponsored ?? 0,
          link_types: r.referring_links_types ?? {},
          link_locations: r.referring_links_semantic_locations ?? {},
        } satisfies BacklinkData;

        console.log(`[backlinks] rank=${(data as BacklinkData).rank} domains=${(data as BacklinkData).referring_domains} total=${total} dofollow=${dofollow} spam=${(data as BacklinkData).spam_score}`);
        break;
      }

      // ── STEP 2: AI mention metrics ────────────────────────────────────
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

      // ── STEP 3: AI mention queries ────────────────────────────────────
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

      // ── STEP 4: Analysis (Claude — no DataForSEO) ─────────────────────
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
