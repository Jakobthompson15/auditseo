import { NextRequest, NextResponse } from "next/server";
import { callWithMCP } from "@/lib/mcp";
import { safeParseJSON } from "@/lib/audit";

export interface KeywordResearchItem {
  keyword: string;
  search_volume: number;
}

export interface KeywordResearchResponse {
  keywords: KeywordResearchItem[];
  totalVolume: number;
  industry: string;
  city: string;
}

function researchPrompt(industry: string, city: string): string {
  return `Use the DataForSEO MCP keyword research tools to find the top 10 most searched service keywords for ${industry} businesses in ${city}.

Use keyword ideas, keyword suggestions, or Google Ads keyword planning tools available via DataForSEO to find real search volume data.
Focus on commercial-intent, service-related keywords — the terms people type when they want to hire or buy (e.g. "${industry.toLowerCase()} services ${city}", "${industry.toLowerCase()} near me", "best ${industry.toLowerCase()} ${city}").
Exclude brand names, informational queries (what is, how to), and single-word queries.

Return ONLY a valid JSON array sorted by search_volume descending:
[
  { "keyword": "<keyword phrase>", "search_volume": <monthly search volume number> }
]
Up to 10 items. Use 0 for unavailable volumes. No markdown, no explanation — only the JSON array.`;
}

export async function POST(req: NextRequest) {
  let body: { industry?: string; city?: string };
  try {
    body = (await req.json()) as { industry?: string; city?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const industry = (body.industry ?? "").trim();
  const city = (body.city ?? "").trim();

  if (!industry || !city) {
    return NextResponse.json({ error: "industry and city are required" }, { status: 400 });
  }

  try {
    const text = await callWithMCP(researchPrompt(industry, city));
    const raw = safeParseJSON<KeywordResearchItem[]>(text, []);
    const keywords = (Array.isArray(raw) ? raw : [])
      .slice(0, 10)
      .map((k) => ({
        keyword: String(k.keyword ?? ""),
        search_volume: Number(k.search_volume ?? 0),
      }))
      .filter((k) => k.keyword.length > 0);

    const totalVolume = keywords.reduce((sum, k) => sum + k.search_volume, 0);

    return NextResponse.json({ keywords, totalVolume, industry, city } satisfies KeywordResearchResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[keywords]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
