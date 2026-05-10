import { NextRequest, NextResponse } from "next/server";

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

// DataForSEO Labs not available — ROI calculator uses industry benchmarks
export async function POST(req: NextRequest) {
  let body: { industry?: string; city?: string };
  try {
    body = (await req.json()) as { industry?: string; city?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const industry = (body.industry ?? "").trim();
  const city = (body.city ?? "").trim();

  return NextResponse.json({ error: "Keyword research requires DataForSEO Labs access" }, { status: 503 });
}
