export interface RankedKeyword {
  keyword: string;
  search_volume: number;
  rank_position: number;
  cpc: number;
  intent: string;
}

export interface OpportunityKeyword {
  keyword: string;
  search_volume: number;
  cpc: number;
  intent: string;
  competition: number;
}

export interface ContentMention {
  title: string;
  url: string;
  domain: string;
  date: string;
  snippet: string;
  sentiment: "positive" | "negative" | "neutral";
}

export type AuditStep =
  | "ranked_keywords"
  | "opportunity_keywords"
  | "content_analysis"
  | "analysis";

export interface AuditContext {
  ranked_keywords: RankedKeyword[];
  opportunity_keywords: OpportunityKeyword[];
  content_analysis: ContentMention[];
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
  data: RankedKeyword[] | OpportunityKeyword[] | ContentMention[] | string;
  error?: string;
}

export type StepStatusState = "pending" | "running" | "done" | "error";

export interface StepStatus {
  id: AuditStep;
  label: string;
  status: StepStatusState;
  error?: string;
}
