import { NextRequest, NextResponse } from "next/server";
import { dfsPost } from "@/lib/dataforseo";

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

// Seed keywords per industry — city is appended to the first 3 to bias results locally
const INDUSTRY_SEEDS: Record<string, string[]> = {
  "Local Services":           ["pest control", "plumber", "electrician", "hvac services", "house cleaning", "lawn care", "handyman"],
  "Home Improvement":         ["roofing contractor", "kitchen remodel", "bathroom renovation", "flooring installation", "window replacement", "painting contractor"],
  "Legal & Professional":     ["personal injury lawyer", "divorce attorney", "criminal defense attorney", "estate planning attorney", "business lawyer"],
  "Healthcare":               ["urgent care", "family doctor", "chiropractor", "dentist", "physical therapy"],
  "Real Estate":              ["homes for sale", "real estate agent", "property management", "houses for rent", "realtor"],
  "Financial Services":       ["financial advisor", "tax preparation", "mortgage broker", "insurance agent", "bookkeeping services"],
  "Restaurant & Hospitality": ["restaurant near me", "catering services", "food delivery", "event catering", "private dining"],
  "E-commerce":               ["online shopping", "free shipping", "buy online", "same day delivery", "discount store"],
  "Technology":               ["it support", "managed it services", "software development", "cybersecurity", "cloud services"],
};

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

  const seeds = INDUSTRY_SEEDS[industry] ?? INDUSTRY_SEEDS["Local Services"]!;
  // Prepend city to first 3 seeds to surface city-specific keywords
  const citySeeds = seeds.slice(0, 3).map(s => `${s} ${city}`);
  const allSeeds = [...citySeeds, ...seeds].slice(0, 8);

  try {
    type KwIdeasItem = {
      keyword?: string;
      keyword_info?: { search_volume?: number; cpc?: number };
    };
    type KwIdeasResult = Array<{ items?: KwIdeasItem[] }>;

    const result = await dfsPost<KwIdeasResult>(
      "/v3/dataforseo_labs/google/keyword_ideas/live",
      [{
        keywords: allSeeds,
        location_code: 2840,
        language_code: "en",
        limit: 50,
        order_by: ["keyword_info.search_volume,desc"],
      }]
    );

    const items = result[0]?.items ?? [];
    const keywords: KeywordResearchItem[] = items
      .map(item => ({
        keyword: item.keyword ?? "",
        search_volume: item.keyword_info?.search_volume ?? 0,
      }))
      .filter(k => k.keyword && k.search_volume > 0)
      .slice(0, 10);

    const totalVolume = keywords.reduce((sum, k) => sum + k.search_volume, 0);

    return NextResponse.json({
      keywords,
      totalVolume,
      industry,
      city,
    } satisfies KeywordResearchResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[keywords]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
