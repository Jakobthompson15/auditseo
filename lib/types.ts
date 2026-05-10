export interface BacklinkData {
  rank: number;
  total_backlinks: number;
  referring_domains: number;
  referring_ips: number;
  referring_pages: number;
  broken_backlinks: number;
  broken_pages: number;
  spam_score: number;
  dofollow: number;
  nofollow: number;
  ugc: number;
  sponsored: number;
  // link type breakdown (anchor, image, redirect, etc.)
  link_types: Record<string, number>;
  // semantic location breakdown (body, footer, nav, etc.)
  link_locations: Record<string, number>;
}

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

export type AuditStep =
  | "backlinks"
  | "ai_metrics"
  | "ai_keywords"
  | "analysis";

export interface AuditContext {
  backlinks: BacklinkData;
  ai_metrics: AIMetrics;
  ai_keywords: AIKeywordItem[];
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
  data: BacklinkData | AIMetrics | AIKeywordItem[] | string;
  error?: string;
}

export type StepStatusState = "pending" | "running" | "done" | "error";

export interface StepStatus {
  id: AuditStep;
  label: string;
  status: StepStatusState;
  error?: string;
}
