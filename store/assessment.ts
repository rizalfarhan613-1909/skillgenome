"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Question } from "@/lib/types";
import { usePrefsStore } from "./prefs";

export type AssessmentQuestion = Pick<
  Question,
  "_id" | "skill" | "difficulty" | "discrimination" | "question" | "options"
>;

export interface AssessmentAnswer {
  question_id: string;
  choice: number;
}

interface AssessmentState {
  questions: AssessmentQuestion[];
  currentIndex: number;
  answers: AssessmentAnswer[];
  startedAt: string | null;
}

interface AssessmentActions {
  startSession: (questions: readonly AssessmentQuestion[]) => void;
  answerQuestion: (questionId: string, choice: number) => void;
  reset: () => void;
}

type AssessmentStore = AssessmentState & AssessmentActions;

const emptyAssessment: AssessmentState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  startedAt: null,
};

/** Menyimpan progres asesmen lokal sesuai izin penyimpanan pengguna. */
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      ...emptyAssessment,
      startSession: (questions) => {
        if (questions.length !== 10) {
          throw new RangeError("Sesi asesmen harus berisi tepat 10 soal.");
        }
        if (new Set(questions.map((question) => question._id)).size !== 10) {
          throw new RangeError("ID soal dalam sesi asesmen harus unik.");
        }

        set({
          questions: [...questions],
          currentIndex: 0,
          answers: [],
          startedAt: new Date().toISOString(),
        });
      },
      answerQuestion: (questionId, choice) => {
        const state = get();
        const currentQuestion = state.questions[state.currentIndex];
        if (!currentQuestion || currentQuestion._id !== questionId) {
          throw new RangeError("Jawaban harus sesuai dengan soal yang aktif.");
        }
        if (!Number.isInteger(choice) || choice < 0 || choice > 3) {
          throw new RangeError("Pilihan jawaban harus berupa angka 0 sampai 3.");
        }

        set({
          answers: [...state.answers, { question_id: questionId, choice }],
          currentIndex: state.currentIndex + 1,
        });
      },
      reset: () => set(emptyAssessment),
    }),
    {
      name: "skillgenome-assessment",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => {
        if (!usePrefsStore.getState().consent.store_data) {
          return emptyAssessment;
        }

        return {
          questions: state.questions,
          currentIndex: state.currentIndex,
          answers: state.answers,
          startedAt: state.startedAt,
        };
      },
    },
  ),
);
