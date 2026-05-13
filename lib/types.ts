export interface DomainRankOverview {
  organic_keywords: number;
  organic_traffic: number;
  pos_1_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_100: number;
}

export interface RankedKeyword {
  keyword: string;
  search_volume: number;
  rank_position: number;
  cpc: number;
  intent: string;
}

export interface KeywordForSite {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
}

export interface SerpCompetitor {
  domain: string;
  avg_position: number;
  keywords_count: number;
  etv: number;
  visibility: number;
}

export interface IntersectionKeyword {
  keyword: string;
  search_volume: number;
  our_position: number;
  competitor_position: number;
  cpc: number;
}

export type AuditStep =
  | "domain_rank_overview"
  | "ranked_keywords"
  | "keywords_for_site"
  | "serp_competitors"
  | "domain_intersection"
  | "analysis";

export interface AuditContext {
  domain_rank_overview: DomainRankOverview;
  ranked_keywords: RankedKeyword[];
  keywords_for_site: KeywordForSite[];
  serp_competitors: SerpCompetitor[];
  domain_intersection: IntersectionKeyword[];
  analysis: string;
}

export interface AuditRequest {
  domain: string;
  step: AuditStep;
  context: Partial<AuditContext>;
  city?: string;
}

export interface AuditResponse {
  step: AuditStep;
  data: DomainRankOverview | RankedKeyword[] | KeywordForSite[] | SerpCompetitor[] | IntersectionKeyword[] | string;
  error?: string;
}

export type StepStatusState = "pending" | "running" | "done" | "error";

export interface StepStatus {
  id: AuditStep;
  label: string;
  status: StepStatusState;
  error?: string;
}
