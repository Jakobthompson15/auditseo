export interface AIMetrics {
  total_mentions: number;
  ai_search_volume: number;
  question_mentions: number;
  answer_mentions: number;
}

export interface AIKeywordItem {
  keyword: string;
  total_count: number;
  ai_search_volume: number;
}

export interface KeywordOpportunity {
  keyword: string;
  search_volume: number;
  cpc: number;
  keyword_difficulty: number;
  intent: string;
  opportunity_score: number;
  rank_position?: number;
}

export interface CompetitorDomain {
  domain: string;
  avg_position: number;
  intersections: number;
  etv: number;
  keywords_count: number;
}

export type AuditStep = "ai_metrics" | "ai_keywords" | "keywords" | "competitors" | "analysis";

export interface AuditContext {
  ai_metrics: AIMetrics;
  ai_keywords: AIKeywordItem[];
  keywords: KeywordOpportunity[];
  competitors: CompetitorDomain[];
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
  data: AIMetrics | AIKeywordItem[] | KeywordOpportunity[] | CompetitorDomain[] | string;
  error?: string;
}

export type StepStatusState = "pending" | "running" | "done" | "error";

export interface StepStatus {
  id: AuditStep;
  label: string;
  status: StepStatusState;
  error?: string;
}
