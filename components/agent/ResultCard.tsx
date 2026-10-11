"use client";

import { useMemo } from "react";
import { RadarGenome } from "@/components/genome/RadarGenome";
import type { AgentToolName } from "@/components/agent/ToolPicker";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SkillChip } from "@/components/ui/SkillChip";
import { SKILLS, type Mastery, type SkillName } from "@/lib/genome-core";

export interface ChainPrefill {
  answers?: { question_id: string; choice: number }[];
  mastery?: Mastery;
}

export interface ResultCardProps {
  tool: AgentToolName;
  result: unknown;
  onChainNext: (tool: AgentToolName, prefill: ChainPrefill) => void;
}

export const chainButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary-strong px-4 text-sm font-medium text-white transition-colors hover:bg-primary";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapPayload(result: unknown): Record<string, unknown> {
  if (!isRecord(result)) {
    return {};
  }
  const inner = result.result;
  if (isRecord(inner)) {
    return { ...inner };
  }
  return result;
}

function isSkillName(value: unknown): value is SkillName {
  return (
    typeof value === "string" && (SKILLS as readonly string[]).includes(value)
  );
}

function toMastery(value: unknown): Mastery | null {
  if (!isRecord(value)) {
    return null;
  }
  const entries: Partial<Record<SkillName, number>> = {};
  for (const skill of SKILLS) {
    const raw = value[skill];
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return null;
    }
    entries[skill] = Math.max(0, Math.min(1, raw));
  }
  return entries as Mastery;
}

export interface AgentQuestion {
  question_id: string;
  skill: string;
  question: string;
  options: string[];
}

function toQuestions(value: unknown): AgentQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const list: AgentQuestion[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const questionId =
      typeof item.question_id === "string"
        ? item.question_id
        : typeof item._id === "string"
          ? item._id
          : null;
    if (
      questionId === null ||
      typeof item.skill !== "string" ||
      typeof item.question !== "string" ||
      !Array.isArray(item.options)
    ) {
      continue;
    }
    list.push({
      question_id: questionId,
      skill: item.skill,
      question: item.question,
      options: item.options.filter(
        (option): option is string => typeof option === "string",
      ),
    });
  }
  return list;
}

export interface AgentStep {
  skill: string;
  prioritySharePct: number | null;
  why: string | null;
  resourceUrl: string | null;
}

function toSteps(value: unknown): AgentStep[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const list: AgentStep[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.skill !== "string") {
      continue;
    }
    const share =
      typeof item.priority_share_pct === "number" &&
      Number.isFinite(item.priority_share_pct)
        ? item.priority_share_pct
        : typeof item.share === "number" && Number.isFinite(item.share)
          ? item.share * 100
          : null;
    list.push({
      skill: item.skill,
      prioritySharePct: share,
      why: typeof item.why === "string" ? item.why : null,
      resourceUrl:
        typeof item.resource_url === "string" ? item.resource_url : null,
    });
  }
  return list;
}

function RawJsonToggle({ result }: { result: unknown }) {
  return (
    <details className="rounded-md border border-glass-border">
      <summary className="min-h-11 cursor-pointer list-none px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-text">
        Lihat JSON raw
      </summary>
      <pre className="max-h-64 overflow-auto border-t border-glass-border bg-bg/60 p-3 font-mono text-xs leading-5 text-muted">
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </details>
  );
}

function StartResult({
  payload,
  onChainNext,
}: {
  payload: Record<string, unknown>;
  onChainNext: ResultCardProps["onChainNext"];
}) {
  const questions = useMemo(
    () =>
      toQuestions(
        Array.isArray(payload.questions)
          ? payload.questions
          : isRecord(payload.result)
            ? payload.result.questions
            : [],
      ),
    [payload],
  );
  const theta0 = typeof payload.theta0 === "number" ? payload.theta0 : null;

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-heading text-base font-semibold text-text">
          {questions.length} soal siap dikerjakan
        </h3>
        {theta0 !== null && (
          <p className="mt-1 font-mono text-xs tabular-nums text-muted">
            theta awal {theta0.toFixed(2)}
          </p>
        )}
      </header>
      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li
            key={question.question_id}
            className="rounded-md border border-glass-border bg-bg/40 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-primary-soft">
                {index + 1}
              </span>
              {isSkillName(question.skill) ? (
                <SkillChip skill={question.skill} />
              ) : (
                <span className="rounded-full border border-glass-border px-3 py-1 text-xs text-muted">
                  {question.skill}
                </span>
              )}
              <span className="font-mono text-[11px] text-muted">
                {question.question_id}
              </span>
            </div>
            <p className="text-sm leading-6 text-text">{question.question}</p>
            <ul
              className="mt-2 space-y-1.5"
              aria-label={`Opsi soal ${index + 1}`}
            >
              {question.options.map((option, optionIndex) => (
                <li
                  key={`${question.question_id}-opt-${optionIndex}`}
                  className="flex items-start gap-2 rounded border border-glass-border px-2.5 py-1.5 text-xs leading-5 text-muted"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2.5 shrink-0 rounded-full border border-glass-border"
                  />
                  <span>
                    <span className="mr-1.5 font-mono tabular-nums">
                      {optionIndex}.
                    </span>
                    {option}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() =>
          onChainNext("submit_assessment_answers", {
            answers: questions.map((question) => ({
              question_id: question.question_id,
              choice: 0,
            })),
          })
        }
        className={chainButtonClassName}
      >
        Lanjut ke Submit Answers
      </button>
    </div>
  );
}

function SubmitResult({
  payload,
  onChainNext,
}: {
  payload: Record<string, unknown>;
  onChainNext: ResultCardProps["onChainNext"];
}) {
  const theta = typeof payload.theta === "number" ? payload.theta : null;
  const mastery = toMastery(payload.mastery);
  const match = isRecord(payload.match) ? payload.match : null;
  const matchPct =
    match && typeof match.match_pct === "number" ? match.match_pct : null;

  if (theta === null || mastery === null || matchPct === null) {
    return null;
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-heading text-base font-semibold text-text">
          Hasil Asesmen
        </h3>
      </header>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="font-mono text-xs text-muted">Theta</p>
          <p className="font-mono text-3xl font-semibold tabular-nums text-text">
            {theta.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-muted">Match</p>
          <p className="font-mono text-3xl font-semibold tabular-nums text-primary-soft">
            {Math.round(matchPct)}%
          </p>
        </div>
      </div>
      <div className="h-64">
        <RadarGenome mastery={mastery} role="data_analyst" />
      </div>
      <ul className="space-y-3" aria-label="Penguasaan per skill">
        {SKILLS.map((skill) => (
          <li key={skill}>
            <ScoreBar value={mastery[skill] * 100} label={skill} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChainNext("recommend_career_path", { mastery })}
        className={chainButtonClassName}
      >
        Lihat Roadmap
      </button>
    </div>
  );
}

function RecommendResult({
  payload,
  onChainNext,
}: {
  payload: Record<string, unknown>;
  onChainNext: ResultCardProps["onChainNext"];
}) {
  const steps = toSteps(payload.steps);
  const match = isRecord(payload.match) ? payload.match : null;
  const matchPct =
    match && typeof match.match_pct === "number" ? match.match_pct : null;

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-heading text-base font-semibold text-text">
          Roadmap {steps.length} Langkah
        </h3>
        {matchPct !== null && (
          <p className="mt-1 text-sm text-muted">
            Kecocokan saat ini{" "}
            <span className="font-mono tabular-nums text-primary-soft">
              {Math.round(matchPct)}%
            </span>
          </p>
        )}
      </header>
      <ol className="space-y-2.5" aria-label="Langkah roadmap">
        {steps.map((step, index) => (
          <li
            key={`${step.skill}-${index}`}
            className="rounded-md border border-glass-border bg-bg/40 p-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-strong font-mono text-xs tabular-nums text-white">
                {index + 1}
              </span>
              {isSkillName(step.skill) ? (
                <SkillChip skill={step.skill} />
              ) : (
                <span className="text-sm text-text">{step.skill}</span>
              )}
              <span className="ml-auto font-mono text-xs tabular-nums text-muted">
                {step.prioritySharePct !== null
                  ? `${step.prioritySharePct.toFixed(1)}%`
                  : ""}
              </span>
            </div>
            {step.why !== null && (
              <p className="mt-2 text-xs leading-5 text-muted">{step.why}</p>
            )}
            {step.resourceUrl !== null && (
              <a
                href={step.resourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block min-h-11 text-xs text-cyan underline underline-offset-4 hover:text-primary-soft"
              >
                Buka materi belajar
              </a>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChainNext("generate_skill_passport", {})}
        className={chainButtonClassName}
      >
        Buat Passport
      </button>
    </div>
  );
}

function PassportResult({ payload }: { payload: Record<string, unknown> }) {
  const passportId =
    typeof payload.passport_id === "string" ? payload.passport_id : null;
  const docUrl = typeof payload.doc_url === "string" ? payload.doc_url : null;
  const emailStatus =
    typeof payload.email_status === "string" ? payload.email_status : null;
  const sentTo = typeof payload.sent_to === "string" ? payload.sent_to : null;

  if (passportId === null) {
    return null;
  }

  async function handleShare() {
    const url = `${window.location.origin}/passport/verify/${passportId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Skill Passport", url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // Pengguna membatalkan share, abaikan.
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-heading text-base font-semibold text-text">
          Passport berhasil dibuat
        </h3>
      </header>
      <dl className="space-y-2 rounded-md border border-glass-border bg-bg/40 p-3 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">ID Passport:</dt>
          <dd className="font-mono tabular-nums text-text">{passportId}</dd>
        </div>
        {sentTo !== null && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Terkirim ke:</dt>
            <dd className="text-text">{sentTo}</dd>
          </div>
        )}
        {emailStatus !== null && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Status email:</dt>
            <dd className="text-text">{emailStatus}</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        {docUrl !== null && (
          <a
            href={docUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chainButtonClassName} flex-1`}
          >
            Buka Google Docs
          </a>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass"
        >
          Bagikan
        </button>
      </div>
    </div>
  );
}

/** Merender hasil tool sebagai card cantik dengan toggle JSON raw. */
export function ResultCard({ tool, result, onChainNext }: ResultCardProps) {
  const payload = useMemo(() => unwrapPayload(result), [result]);

  let body: React.ReactNode = null;
  if (tool === "start_skill_assessment") {
    body = <StartResult payload={payload} onChainNext={onChainNext} />;
  } else if (tool === "submit_assessment_answers") {
    body = <SubmitResult payload={payload} onChainNext={onChainNext} />;
  } else if (tool === "recommend_career_path") {
    body = <RecommendResult payload={payload} onChainNext={onChainNext} />;
  } else if (tool === "generate_skill_passport") {
    body = <PassportResult payload={payload} />;
  }

  if (body === null) {
    return (
      <pre className="overflow-auto rounded-md bg-bg/60 p-2 font-mono text-xs leading-5">
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {body}
      <RawJsonToggle result={result} />
    </div>
  );
}

