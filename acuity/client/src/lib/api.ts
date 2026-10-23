// Thin fetch wrapper for the Acuity API (async job-queue edition).
//
// AI generation runs on a Hatch agent worker: the client creates a job,
// polls GET /api/jobs/:id, and renders sections as they accumulate — the
// same progressive UX the old SSE stream provided. All exported function
// names and signatures are unchanged.

import type { ChatMessage, ChatResult, ParsedStatement, WizardInput } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// Canonical section order — matches the server's SECTION_KEYS.
const SECTION_ORDER = [
  "assetLocation",
  "withdrawalSequencing",
  "retirementStrategy",
  "deductionsCredits",
  "entityStructuring",
  "roadmap",
] as const;

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

interface JobState {
  jobId: string;
  status: "pending" | "working" | "done" | "error";
  result: any;
  error?: string | null;
}

async function createJob(type: "plan" | "chat" | "parse401k", input: unknown): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, input }),
  });
  const json = await res.json();
  if (!res.ok || !json?.jobId) {
    throw new Error(json?.error || `Job creation failed (${res.status})`);
  }
  return json.jobId as string;
}

async function getJob(jobId: string): Promise<JobState> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Job lookup failed (${res.status})`);
  }
  return json as JobState;
}

export interface PlanPollOptions {
  onStatus?: (status: "pending" | "working") => void;
  onJobId?: (jobId: string) => void;
  onSlow?: () => void;
  timeoutMs?: number;
  resumeJobId?: string;
}

// Slow notice after 10 min (reassure, don't error); hard stop at 30 min so a
// job that needed the 15-min stuck-detector retry still finishes client-side.
const PLAN_SLOW_AFTER_MS = 10 * 60 * 1000;
const PLAN_DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export async function fetchRecommendations(
  input: WizardInput,
  onSection: (key: string, data: any, source: "ai"|"rules") => void,
  onSummary: (summary: any, disclaimer: string) => void,
  onDone: (aiSections: number) => void,
  onError: (err: string) => void,
  options?: PlanPollOptions
): Promise<void> {
  const startedAt = Date.now();
  const deadline = startedAt + (options?.timeoutMs ?? PLAN_DEFAULT_TIMEOUT_MS);
  const firedSections = new Set<string>();
  let summaryFired = false;
  let slowFired = false;
  let lastStatus: "pending" | "working" | null = null;

  const fireNew = (result: any) => {
    if (!summaryFired && result?.summary) {
      summaryFired = true;
      onSummary(result.summary, result.disclaimer ?? "");
    }
    const sections = result?.sections ?? {};
    for (const key of SECTION_ORDER) {
      if (!firedSections.has(key) && sections[key]?.data) {
        firedSections.add(key);
        onSection(key, sections[key].data, sections[key].source === "ai" ? "ai" : "rules");
      }
    }
  };

  try {
    const jobId = options?.resumeJobId ?? await createJob("plan", input);
    options?.onJobId?.(jobId);
    while (true) {
      const now = Date.now();
      if (!slowFired && now - startedAt > PLAN_SLOW_AFTER_MS) {
        slowFired = true;
        options?.onSlow?.();
      }
      if (now > deadline) {
        onError("This is taking longer than expected. Your plan is still being built — you can keep waiting, nothing is lost.");
        return;
      }
      const job = await getJob(jobId);
      if ((job.status === "pending" || job.status === "working") && job.status !== lastStatus) {
        lastStatus = job.status;
        options?.onStatus?.(job.status);
      }
      fireNew(job.result);
      if (job.status === "done") {
        // Fire any sections that arrived with the final update, in order.
        fireNew(job.result);
        const sections = job.result?.sections ?? {};
        const aiSections = SECTION_ORDER.filter(k => sections[k]?.source === "ai").length;
        onDone(aiSections);
        return;
      }
      if (job.status === "error") {
        onError(job.error || "The AI advisor hit an error generating your plan.");
        return;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err: any) {
    onError(err?.message || "Network error.");
  }
}

export async function sendChatMessage(
  question: string,
  clientContext: string,
  history: ChatMessage[],
  prospectMode = false
): Promise<ApiResult<ChatResult>> {
  const deadline = Date.now() + 240_000;
  try {
    const jobId = await createJob("chat", { question, clientContext, history, prospectMode });
    while (true) {
      if (Date.now() > deadline) {
        return { success: false, error: "Chat request timed out. Please try again." };
      }
      const job = await getJob(jobId);
      if (job.status === "done") {
        const reply = job.result?.reply;
        if (!reply) return { success: false, error: "No response from AI." };
        return { success: true, data: { reply } };
      }
      if (job.status === "error") {
        return { success: false, error: job.error || "Chat request failed." };
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error." };
  }
}

export interface QuickAction {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

export interface QuickResult {
  bracket: number;
  effectiveRate: number;
  estimatedTax: number;
  healthScore: number;
  healthLabel: string;
  topActions: QuickAction[];
  savingsGapMessage: string;
}

export interface QuickInput {
  filingStatus: "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household";
  age: number;
  state: string;
  annualIncome: number;
  totalRetirementSavings: number;
}

export async function fetchQuickRecommendations(input: QuickInput): Promise<ApiResult<QuickResult>> {
  try {
    const res = await fetch(`${API_BASE_URL}/quick-recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.error || `Request failed (${res.status})` };
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error." };
  }
}

export async function uploadStatement(file: File): Promise<ApiResult<ParsedStatement>> {
  const deadline = Date.now() + 300_000;
  try {
    const formData = new FormData();
    formData.append("statement", file);
    const res = await fetch(`${API_BASE_URL}/parse-401k`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || !json?.jobId) {
      return { success: false, error: json?.error || `Upload failed (${res.status})` };
    }
    const jobId = json.jobId as string;
    while (true) {
      if (Date.now() > deadline) {
        return { success: false, error: "Statement parsing timed out. Please try again." };
      }
      const job = await getJob(jobId);
      if (job.status === "done") {
        if (!job.result?.parsed) return { success: false, error: "Parsing produced no result." };
        return { success: true, data: job.result.parsed };
      }
      if (job.status === "error") {
        return { success: false, error: job.error || "Statement parsing failed." };
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error uploading statement." };
  }
}
