import { z } from "zod";

export const SkillNameSchema = z.enum([
  "SQL",
  "Python",
  "Statistics",
  "Excel",
  "DataViz",
  "BusinessAcumen",
  "Communication",
  "DomainKnowledge",
]);

export const QuestionSchema = z.object({
  _id: z.string(),
  role: z.literal("data_analyst"),
  skill: SkillNameSchema,
  difficulty: z.number().min(-3).max(3),
  discrimination: z.number().min(0.5).max(2),
  question: z.string().min(10),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string().min(10),
  calibration: z.literal("manual_v1"),
});

export const SkillSchema = z.object({
  _id: z.string(),
  name: SkillNameSchema,
  description: z.string(),
  emb8: z.array(z.number()).length(8),
  importance_data_analyst: z.number().min(0).max(1),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        hours: z.number().positive(),
      }),
    )
    .min(1),
});

export const JobMarketSchema = z.object({
  _id: z.string(),
  name: z.string(),
  required_skills: z.record(SkillNameSchema, z.number()),
  salary_range: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    currency: z.string(),
    source: z.string(),
  }),
  job_count: z.number().nullable(),
  scope: z.literal("global_benchmark"),
  source: z.string(),
});

const AssessmentAnswerSchema = z.object({
  question_id: z.string(),
  choice: z.number().int().min(0).max(3),
});

export const StartAssessmentRequest = z.object({
  user_id: z.string(),
  target_role: z.literal("data_analyst"),
});

export const SubmitAnswersRequest = z.object({
  user_id: z.string(),
  answers: z.array(AssessmentAnswerSchema).length(10),
});

export const RecommendPathRequest = z.object({
  user_id: z.string(),
  target_role: z.literal("data_analyst"),
});

export const GeneratePassportRequest = z.object({
  user_id: z.string(),
  email: z.string().email(),
  confirm: z.literal(true),
});

export const UserSchema = z.object({
  _id: z.string(),
  alias: z.string().nullable(),
  email: z.string().email().nullable(),
  target_role: z.literal("data_analyst"),
  genome: z.array(z.number()).length(8),
  mastery: z.record(SkillNameSchema, z.number()),
  theta: z.number(),
  history: z
    .array(
      z.object({
        at: z.string().datetime(),
        theta: z.number(),
        match_pct: z.number(),
      }),
    )
    .max(20),
  consent: z.object({
    email_send: z.boolean().default(false),
    public_passport: z.boolean().default(false),
  }),
  created_at: z.string().datetime(),
});
