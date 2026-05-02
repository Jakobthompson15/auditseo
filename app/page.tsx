"use client";

import { useCallback, useState } from "react";
import type {
  AuditContext,
  AuditStep,
  BacklinkData,
  CompetitorItem,
  KeywordItem,
  AIKeywordItem,
  AIMetrics,
  RankData,
  StepStatus,
} from "@/lib/types";
import {
  computeAIScore,
  computeSEOScore,
  sanitizeDomain,
  summaryPills,
} from "@/lib/audit";
import DomainInput from "@/components/DomainInput";
import ProgressTracker from "@/components/ProgressTracker";
import ScoreCard from "@/components/ScoreCard";
import SEOSection from "@/components/SEOSection";
import KeywordsTable from "@/components/KeywordsTable";
import CompetitorSection from "@/components/CompetitorSection";
import AISection from "@/components/AISection";
import AnalysisCard from "@/components/AnalysisCard";
import RevenueCalculator from "@/components/RevenueCalculator";

const STEP_LABELS: Record<AuditStep, string> = {
  rank: "Domain rank overview",
  backlinks: "Backlink profile",
  keywords: "Ranked keywords",
  competitors: "Industry competitors",
  ai_metrics: "AI mention metrics",
  ai_keywords: "AI mention queries",
  analysis: "Generating analysis",
};

const ALL_STEPS: AuditStep[] = [
  "rank",
  "backlinks",
  "keywords",
  "competitors",
  "ai_metrics",
  "ai_keywords",
  "analysis",
];

function makeInitialSteps(): StepStatus[] {
  return ALL_STEPS.map((id) => ({
    id,
    label: STEP_LABELS[id],
    status: "pending",
  }));
}

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

const DEFAULT_COMPETITORS: CompetitorItem[] = [];

export default function Home() {
  const [rawDomain, setRawDomain] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>(makeInitialSteps());
  const [auditData, setAuditData] = useState<Partial<AuditContext>>({});
  const [failedAtStep, setFailedAtStep] = useState<AuditStep | null>(null);

  const updateStep = useCallback(
    (id: AuditStep, patch: Partial<StepStatus>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const runFrom = useCallback(
    async (startStep: AuditStep, domain: string, priorData: Partial<AuditContext>) => {
      setIsRunning(true);
      setFailedAtStep(null);

      const startIndex = ALL_STEPS.indexOf(startStep);
      const context = { ...priorData };

      for (let i = startIndex; i < ALL_STEPS.length; i++) {
        const step = ALL_STEPS[i];
        updateStep(step, { status: "running", error: undefined });

        try {
          const res = await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain, step, context }),
          });

          const json = (await res.json()) as {
            step: AuditStep;
            data?: AuditContext[AuditStep];
            error?: string;
          };

          if (!res.ok || json.error) {
            const msg = json.error ?? `HTTP ${res.status}`;
            updateStep(step, { status: "error", error: msg });
            setFailedAtStep(step);
            setIsRunning(false);
            return;
          }

          // Type-safe step assignment
          const data = json.data;
          if (data !== undefined) {
            switch (step) {
              case "rank":
                context.rank = data as RankData;
                break;
              case "backlinks":
                context.backlinks = data as BacklinkData;
                break;
              case "keywords":
                context.keywords = data as KeywordItem[];
                break;
              case "competitors":
                context.competitors = data as CompetitorItem[];
                break;
              case "ai_metrics":
                context.ai_metrics = data as AIMetrics;
                break;
              case "ai_keywords":
                context.ai_keywords = data as AIKeywordItem[];
                break;
              case "analysis":
                context.analysis = data as string;
                break;
            }
            setAuditData({ ...context });
          }

          updateStep(step, { status: "done" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Network error";
          updateStep(step, { status: "error", error: msg });
          setFailedAtStep(step);
          setIsRunning(false);
          return;
        }
      }

      setIsRunning(false);
    },
    [updateStep]
  );

  const handleSubmit = useCallback(() => {
    const domain = sanitizeDomain(rawDomain);
    if (!domain) return;
    setAuditData({});
    setSteps(makeInitialSteps());
    setHasRun(true);
    void runFrom("rank", domain, {});
  }, [rawDomain, runFrom]);

  const handleRetry = useCallback(
    (stepId: string) => {
      const domain = sanitizeDomain(rawDomain);
      if (!domain) return;
      // Reset this step and all subsequent steps
      const idx = ALL_STEPS.indexOf(stepId as AuditStep);
      setSteps((prev) =>
        prev.map((s, i) =>
          i >= idx ? { ...s, status: "pending", error: undefined } : s
        )
      );
      void runFrom(stepId as AuditStep, domain, auditData);
    },
    [rawDomain, auditData, runFrom]
  );

  // Derived display values — always have fallbacks
  const rank = auditData.rank ?? DEFAULT_RANK;
  const backlinks = auditData.backlinks ?? DEFAULT_BACKLINKS;
  const keywords = auditData.keywords ?? [];
  const competitors = auditData.competitors ?? DEFAULT_COMPETITORS;
  const aiMetrics = auditData.ai_metrics ?? DEFAULT_AI_METRICS;
  const aiKeywords = auditData.ai_keywords ?? [];
  const analysis = auditData.analysis ?? "";

  const seoScore = auditData.rank && auditData.backlinks
    ? computeSEOScore(rank, backlinks)
    : 0;
  const aiScore = auditData.ai_metrics ? computeAIScore(aiMetrics) : 0;
  const pills =
    auditData.rank && auditData.backlinks && auditData.ai_metrics
      ? summaryPills(rank, backlinks, aiMetrics)
      : [];

  const showScores = !!(auditData.rank && auditData.backlinks);
  const showSEO = !!(auditData.rank && auditData.backlinks);
  const showKeywords = keywords.length > 0;
  const showCompetitors = competitors.length > 0;
  const showAI = !!(auditData.ai_metrics);
  const showAnalysis = !!analysis;

  const auditing = isRunning || hasRun;

  return (
    <main
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "4rem 1.25rem 6rem",
      }}
    >
      {/* Header */}
      <div className="no-print" style={{ textAlign: "center", marginBottom: "3rem" }}>
        {/* Syndicate Marketing branding */}
        {/* To use real logo: save file to /public/logo.svg and uncomment <img> below */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* <img src="/logo.svg" alt="Syndicate Marketing" style={{ height: 40 }} /> */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
            {/* S icon placeholder */}
            <div
              style={{
                width: 36,
                height: 36,
                background: "white",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: "1.1rem", color: "#000", letterSpacing: "-0.05em" }}>S</span>
            </div>
            <div style={{ textAlign: "left", lineHeight: 1.1 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.2em", color: "#ffffff", textTransform: "uppercase" }}>
                SYNDICATE
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: "0.62rem", letterSpacing: "0.35em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                MARKETING
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.25rem",
            background: "var(--purple-dim)",
            border: "1px solid rgba(124,106,247,0.25)",
            borderRadius: 9999,
            padding: "4px 12px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--purple)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--purple)",
              textTransform: "uppercase",
            }}
          >
            SEO + AI Visibility
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: "0.75rem",
          }}
        >
          Marketing Visibility{" "}
          <span style={{ color: "var(--purple)" }}>Audit</span>
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Combined SEO authority and AI/LLM brand presence report — powered by
          DataForSEO and Claude.
        </p>
      </div>

      {/* Print-only report header */}
      {auditing && (
        <div className="print-only" style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--purple)", marginBottom: "0.35rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
            Syndicate Marketing
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Marketing Visibility Audit
          </p>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {sanitizeDomain(rawDomain)}
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Prepared by Syndicate Marketing
          </p>
        </div>
      )}

      {/* Input */}
      <div className="no-print">
      <DomainInput
        value={rawDomain}
        onChange={setRawDomain}
        onSubmit={handleSubmit}
        disabled={isRunning}
      />
      </div>

      {/* Progress */}
      {auditing && (
        <div className="no-print" style={{ marginTop: "2.5rem" }}>
          <ProgressTracker
            steps={steps}
            onRetry={failedAtStep ? handleRetry : undefined}
          />
        </div>
      )}

      {/* Report */}
      {auditing && (
        <div style={{ marginTop: "2rem" }} id="audit-report">
          {/* Score cards */}
          {showScores && (
            <div
              className="scores-row"
              style={{ display: "flex", gap: "1rem", marginBottom: "0" }}
            >
              <ScoreCard
                label="SEO Score"
                score={seoScore}
                accent="var(--seo)"
                accentDim="rgba(79,235,180,0.15)"
                sublabel="Authority"
              />
              <ScoreCard
                label="AI Score"
                score={aiScore}
                accent="var(--ai)"
                accentDim="rgba(180,106,247,0.15)"
                sublabel="LLM Visibility"
              />
            </div>
          )}

          {/* SEO stats */}
          {showSEO && <SEOSection rank={rank} backlinks={backlinks} />}

          {/* Keywords */}
          {showKeywords && <KeywordsTable keywords={keywords} />}

          {/* Competitors */}
          {showCompetitors && (
            <CompetitorSection
              competitors={competitors}
              auditedDomain={sanitizeDomain(rawDomain)}
              auditedRank={rank}
              auditedBacklinks={backlinks}
            />
          )}

          {/* AI section */}
          {showAI && (
            <AISection metrics={aiMetrics} aiKeywords={aiKeywords} />
          )}

          {/* Analysis */}
          {showAnalysis && (
            <AnalysisCard text={analysis} pills={pills} />
          )}

          {/* Revenue calculator — web-only sales tool */}
          {showAnalysis && !isRunning && (
            <RevenueCalculator rank={rank} />
          )}

          {/* PDF download — only shown when full report is ready */}
          {showAnalysis && !isRunning && (
            <div
              className="no-print"
              style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}
            >
              <button
                onClick={() => window.print()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.06em",
                  color: "#fff",
                  background: "var(--purple)",
                  border: "1px solid rgba(124,106,247,0.6)",
                  borderRadius: 8,
                  padding: "0.7rem 1.5rem",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  boxShadow: "0 0 20px rgba(124,106,247,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M7 1v7M4 5l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="no-print"
        style={{
          marginTop: "4rem",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
        }}
      >
        Powered by Syndicate Marketing · DataForSEO + Claude
      </footer>
    </main>
  );
}
