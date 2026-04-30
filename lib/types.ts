export interface RankData {
  organic_count: number;
  paid_count: number;
  organic_etv: number;
  pos_1_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_100: number;
}

export interface BacklinkData {
  total_backlinks: number;
  referring_domains: number;
  dofollow: number;
  nofollow: number;
  rank: number;
  referring_ips: number;
}

export interface KeywordItem {
  keyword: string;
  rank: number;
  search_volume: number;
  cpc: number;
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
  | "rank"
  | "backlinks"
  | "keywords"
  | "ai_metrics"
  | "ai_keywords"
  | "analysis";

export interface AuditContext {
  rank: RankData;
  backlinks: BacklinkData;
  keywords: KeywordItem[];
  ai_metrics: AIMetrics;
  ai_keywords: AIKeywordItem[];
  analysis: string;
}

export interface AuditRequest {
  domain: string;
  step: AuditStep;
  context: Partial<AuditContext>;
}

export interface AuditResponse {
  step: AuditStep;
  data:
    | RankData
    | BacklinkData
    | KeywordItem[]
    | AIMetrics
    | AIKeywordItem[]
    | string;
  error?: string;
}

export type StepStatusState = "pending" | "running" | "done" | "error";

export interface StepStatus {
  id: AuditStep;
  label: string;
  status: StepStatusState;
  error?: string;
}
