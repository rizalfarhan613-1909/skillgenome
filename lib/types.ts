import { z } from "zod";
import {
  GeneratePassportRequest,
  JobMarketSchema,
  QuestionSchema,
  RecommendPathRequest,
  SkillSchema,
  StartAssessmentRequest,
  SubmitAnswersRequest,
  UserSchema,
} from "./schemas";

export type Question = z.infer<typeof QuestionSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type JobMarket = z.infer<typeof JobMarketSchema>;
export type User = z.infer<typeof UserSchema>;

export type StartAssessmentRequest = z.infer<typeof StartAssessmentRequest>;
export type SubmitAnswersRequest = z.infer<typeof SubmitAnswersRequest>;
export type RecommendPathRequest = z.infer<typeof RecommendPathRequest>;
export type GeneratePassportRequest = z.infer<typeof GeneratePassportRequest>;
