import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AuditRequest,
  AuditStep,
  RankData,
  BacklinkData,
  KeywordItem,
  AIMetrics,
  AIKeywordItem,
  AuditContext,
} from "@/lib/types";
import { safeParseJSON } from "@/lib/audit";

// ── Rate limiting (in-memory) ──────────────────────────────────────────────
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

// ── Defaults (safe fallbacks so the UI never sees "undefined") ─────────────
const DEFAULT_RANK: RankData = {
  organic_count: 0,
  paid_count: 0,
  organic_etv: 0,
  pos_1_3: 0,
  pos_4_10: 0,
  pos_11_20: 0,
  pos_21_100: 0,
};

const DEFAULT_BACKLINKS: BacklinkData = {
  total_backlinks: 0,
  referring_domains: 0,
  dofollow: 0,
  nofollow: 0,
  rank: 0,
  referring_ips: 0,
};

const DEFAULT_AI_METRICS: AIMetrics = {
  total_mentions: 0,
  ai_search_volume: 0,
  question_mentions: 0,
  answer_mentions: 0,
};

// ── Anthropic + DataForSEO MCP call ───────────────────────────────────────
async function callWithMCP(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const mcpServer: {
    type: "url";
    url: string;
    name: string;
    authorization_token?: string;
  } = {
    type: "url",
    url: process.env.DATAFORSEO_MCP_URL ?? "https://mcp.dataforseo.com/mcp",
    name: "dataforseo",
  };

  if (process.env.DATAFORSEO_API_TOKEN) {
    mcpServer.authorization_token = process.env.DATAFORSEO_API_TOKEN;
  }

  // mcp_servers is a beta param not yet in all SDK type definitions — double-cast via unknown
  type CreateFn = (p: unknown) => Promise<Anthropic.Beta.BetaMessage>;
  const createMessage = client.beta.messages.create.bind(client.beta.messages) as unknown as CreateFn;
  const response = await createMessage({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    stream: false,
    messages: [{ role: "user", content: prompt }],
    betas: ["mcp-client-2025-04-04"],
    mcp_servers: [mcpServer],
  });

  // Find last text block — appears after any MCP tool use/result blocks
  for (let i = response.content.length - 1; i >= 0; i--) {
    const block = response.content[i];
    if (block.type === "text") return block.text;
  }
  return "";
}

// ── Step prompts ──────────────────────────────────────────────────────────
function rankPrompt(domain: string): string {
  return `Use the DataForSEO MCP tools to retrieve domain rank overview data for "${domain}".
Return ONLY a valid JSON object with these exact fields (use 0 for any unavailable value):
{
  "organic_count": <number of organic keywords>,
  "paid_count": <number of paid/PPC keywords>,
  "organic_etv": <estimated monthly traffic value USD>,
  "pos_1_3": <keywords ranking positions 1-3>,
  "pos_4_10": <keywords ranking positions 4-10>,
  "pos_11_20": <keywords ranking positions 11-20>,
  "pos_21_100": <keywords ranking positions 21-100>
}
No markdown, no explanation — only the JSON object.`;
}

function backlinksPrompt(domain: string): string {
  return `Use the DataForSEO MCP tools to retrieve backlink summary data for "${domain}".
Return ONLY a valid JSON object with these exact fields (use 0 for any unavailable value):
{
  "total_backlinks": <total backlink count>,
  "referring_domains": <unique referring domains>,
  "dofollow": <dofollow backlink count>,
  "nofollow": <nofollow backlink count>,
  "rank": <domain authority rank score 0-100>,
  "referring_ips": <unique referring IP addresses>
}
No markdown, no explanation — only the JSON object.`;
}

function keywordsPrompt(domain: string): string {
  return `Use the DataForSEO MCP tools to get the top 8 organic keywords for "${domain}", ordered by search volume descending.
Return ONLY a valid JSON array with up to 8 items (use [] if unavailable):
[
  {
    "keyword": "<keyword string>",
    "rank": <current ranking position number>,
    "search_volume": <monthly search volume number>,
    "cpc": <cost per click USD number>
  }
]
No markdown, no explanation — only the JSON array.`;
}

function aiMetricsPrompt(domain: string): string {
  return `Use the DataForSEO MCP tools to get LLM mention aggregated metrics for "${domain}" across AI platforms.
Return ONLY a valid JSON object with these exact fields (use 0 for any unavailable value):
{
  "total_mentions": <total AI mention count>,
  "ai_search_volume": <AI search volume>,
  "question_mentions": <mentions in question context>,
  "answer_mentions": <mentions in answer context>
}
No markdown, no explanation — only the JSON object.`;
}

function aiKeywordsPrompt(domain: string): string {
  return `Use the DataForSEO MCP tools to get the top 6 AI mention queries for "${domain}" across AI platforms.
Return ONLY a valid JSON array with up to 6 items (use [] if unavailable):
[
  {
    "keyword": "<query string>",
    "total_count": <total mention count number>,
    "ai_search_volume": <AI search volume number>
  }
]
No markdown, no explanation — only the JSON array.`;
}

function analysisPrompt(
  domain: string,
  context: Partial<AuditContext>
): string {
  return `You are a senior digital marketing analyst. Here is the full audit data for "${domain}":

${JSON.stringify(context, null, 2)}

Write exactly 3 sentences of expert marketing analysis:
1. Assess the SEO authority — cite specific numbers (domain rank, organic keywords, top-3 rankings, referring domains).
2. Evaluate the AI/LLM visibility signal — cite total mentions, AI search volume, and answer vs question ratio.
3. Give one concrete strategic recommendation tailored to this domain's specific strengths and gaps.

Write as flowing prose. No bullet points, no headers, no markdown. Use the actual numbers from the data.`;
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Same-origin CORS check
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

  const { domain, step, context = {} } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing or invalid domain" }, { status: 400 });
  }

  const validSteps: AuditStep[] = [
    "rank",
    "backlinks",
    "keywords",
    "ai_metrics",
    "ai_keywords",
    "analysis",
  ];
  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  try {
    let data:
      | RankData
      | BacklinkData
      | KeywordItem[]
      | AIMetrics
      | AIKeywordItem[]
      | string;

    switch (step) {
      case "rank": {
        const text = await callWithMCP(rankPrompt(domain));
        data = safeParseJSON<RankData>(text, DEFAULT_RANK);
        // Ensure all numeric fields are numbers, not undefined
        const r = data as RankData;
        data = {
          organic_count: r.organic_count ?? 0,
          paid_count: r.paid_count ?? 0,
          organic_etv: r.organic_etv ?? 0,
          pos_1_3: r.pos_1_3 ?? 0,
          pos_4_10: r.pos_4_10 ?? 0,
          pos_11_20: r.pos_11_20 ?? 0,
          pos_21_100: r.pos_21_100 ?? 0,
        };
        break;
      }

      case "backlinks": {
        const text = await callWithMCP(backlinksPrompt(domain));
        data = safeParseJSON<BacklinkData>(text, DEFAULT_BACKLINKS);
        const b = data as BacklinkData;
        data = {
          total_backlinks: b.total_backlinks ?? 0,
          referring_domains: b.referring_domains ?? 0,
          dofollow: b.dofollow ?? 0,
          nofollow: b.nofollow ?? 0,
          rank: b.rank ?? 0,
          referring_ips: b.referring_ips ?? 0,
        };
        break;
      }

      case "keywords": {
        const text = await callWithMCP(keywordsPrompt(domain));
        const raw = safeParseJSON<KeywordItem[]>(text, []);
        data = (Array.isArray(raw) ? raw : [])
          .slice(0, 8)
          .map((k) => ({
            keyword: String(k.keyword ?? ""),
            rank: Number(k.rank ?? 0),
            search_volume: Number(k.search_volume ?? 0),
            cpc: Number(k.cpc ?? 0),
          }));
        break;
      }

      case "ai_metrics": {
        const text = await callWithMCP(aiMetricsPrompt(domain));
        data = safeParseJSON<AIMetrics>(text, DEFAULT_AI_METRICS);
        const m = data as AIMetrics;
        data = {
          total_mentions: m.total_mentions ?? 0,
          ai_search_volume: m.ai_search_volume ?? 0,
          question_mentions: m.question_mentions ?? 0,
          answer_mentions: m.answer_mentions ?? 0,
        };
        break;
      }

      case "ai_keywords": {
        const text = await callWithMCP(aiKeywordsPrompt(domain));
        const raw = safeParseJSON<AIKeywordItem[]>(text, []);
        data = (Array.isArray(raw) ? raw : [])
          .slice(0, 6)
          .map((k) => ({
            keyword: String(k.keyword ?? ""),
            total_count: Number(k.total_count ?? 0),
            ai_search_volume: Number(k.ai_search_volume ?? 0),
          }));
        break;
      }

      case "analysis": {
        data = await callWithMCP(analysisPrompt(domain, context));
        if (!data || typeof data !== "string" || data.trim() === "") {
          data = "Analysis could not be generated. Please retry.";
        }
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
