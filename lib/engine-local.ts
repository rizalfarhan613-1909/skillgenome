/**
 * Implementasi lokal keempat tool engine. Dipakai sebagai fallback saat
 * Langflow tidak dapat dijangkau (misalnya di Vercel yang tidak bisa ke
 * localhost). Seluruh angka dihitung deterministik lewat `genome-core`.
 */

import questionBank from "./data/questions.json";
import type { Question } from "./types";
import {
  bktReplay,
  estimateTheta,
  greedyPath,
  matchScore,
  selectItems,
  type IrtResponse,
  type Mastery,
  type RoadmapStep,
} from "./genome-core";

const QUESTIONS = questionBank as Question[];

const questionById = new Map(
  QUESTIONS.map((question) => [question._id, question]),
);

export interface StartAssessmentInput {
  user_id: string;
  target_role: string;
}

export interface StartAssessmentResult {
  user_id: string;
  target_role: string;
  questions: Question[];
  theta0: number;
}

export interface SubmitAnswersInput {
  user_id: string;
  answers: { question_id: string; choice: number }[];
}

export interface SubmitAnswersResult {
  user_id: string;
  theta: number;
  mastery: Mastery;
  match: { cosine: number; coverage: number; match_pct: number };
}

export interface RecommendPathInput {
  user_id: string;
  target_role: string;
  mastery?: Mastery;
}

export interface RecommendPathResult {
  user_id: string;
  target_role: string;
  match: { cosine: number; coverage: number; match_pct: number };
  steps: RoadmapStep[];
}

export interface GeneratePassportInput {
  user_id: string;
  email: string;
  confirm: boolean;
}

export interface GeneratePassportResult {
  passport_id: string;
  doc_url: string;
  email_status: "simulated";
  sent_to: string;
}

export class EngineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineValidationError";
  }
}

function requireUserId(userId: unknown): string {
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new EngineValidationError("user_id wajib berupa teks yang tidak kosong.");
  }
  return userId;
}

function requireTargetRole(targetRole: unknown): string {
  if (typeof targetRole !== "string" || targetRole.trim() === "") {
    throw new EngineValidationError("target_role wajib berupa teks yang tidak kosong.");
  }
  return targetRole;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Menjalankan tool start_skill_assessment: memilih 10 soal adaptif dari bank
 * soal berdasarkan informasi Fisher pada theta awal.
 */
export function runStartAssessment(
  input: StartAssessmentInput,
): StartAssessmentResult {
  const userId = requireUserId(input.user_id);
  const targetRole = requireTargetRole(input.target_role);

  const chosenIds = selectItems(
    0,
    QUESTIONS.map((question) => ({
      id: question._id,
      skill: question.skill,
      discrimination: question.discrimination,
      difficulty: question.difficulty,
    })),
    10,
  );

  const chosenSet = new Set(chosenIds);
  const questions = QUESTIONS.filter((question) => chosenSet.has(question._id));

  return { user_id: userId, target_role: targetRole, questions, theta0: 0 };
}

/**
 * Menjalankan tool submit_assessment_answers: mengestimasi theta, mastery, dan
 * skor kecocokan dari sepuluh jawaban.
 */
export function runSubmitAnswers(
  input: SubmitAnswersInput,
): SubmitAnswersResult {
  const userId = requireUserId(input.user_id);

  if (!Array.isArray(input.answers) || input.answers.length !== 10) {
    throw new EngineValidationError("answers wajib berisi tepat 10 jawaban.");
  }

  const irtResponses: IrtResponse[] = [];
  const bktResponses: { skill: Question["skill"]; correct: boolean }[] = [];

  for (const answer of input.answers) {
    const question = questionById.get(answer.question_id);
    if (!question) {
      throw new EngineValidationError(
        `Soal ${String(answer.question_id)} tidak ditemukan di bank soal.`,
      );
    }
    const correct = answer.choice === question.correct;
    irtResponses.push({
      a: question.discrimination,
      b: question.difficulty,
      correct,
    });
    bktResponses.push({ skill: question.skill, correct });
  }

  const theta = estimateTheta(irtResponses);
  const mastery = bktReplay(bktResponses);
  const match = matchScore(mastery);

  return { user_id: userId, theta, mastery, match };
}

/**
 * Menjalankan tool recommend_career_path: menghitung ulang kecocokan dan
 * menyusun lima langkah belajar berprioritas. Bila `mastery` tidak dikirim,
 * dipakai mastery awal dari BKT (semua skill pada probabilitas awal).
 */
export function runRecommendPath(
  input: RecommendPathInput,
): RecommendPathResult {
  const userId = requireUserId(input.user_id);
  const targetRole = requireTargetRole(input.target_role);

  const mastery = input.mastery ?? bktReplay([]);
  const match = matchScore(mastery);
  const steps = greedyPath(mastery, "data_analyst", 5);

  return { user_id: userId, target_role: targetRole, match, steps };
}

/**
 * Menjalankan tool generate_skill_passport: memvalidasi izin sebelum membuat
 * artefak. Tanpa `confirm=true` permintaan ditolak (human-in-the-loop).
 */
export function runGeneratePassport(
  input: GeneratePassportInput,
): GeneratePassportResult {
  const userId = requireUserId(input.user_id);

  if (typeof input.email !== "string" || !EMAIL_PATTERN.test(input.email.trim())) {
    throw new EngineValidationError("email wajib berupa alamat email yang valid.");
  }
  if (input.confirm !== true) {
    throw new EngineValidationError(
      "Passport hanya dibuat setelah confirm=true disetujui user.",
    );
  }

  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const passportId = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");

  return {
    passport_id: passportId,
    doc_url: `https://docs.example.com/skillgenome/${passportId}`,
    email_status: "simulated",
    sent_to: input.email.trim(),
  };
}
