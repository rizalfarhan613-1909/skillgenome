"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Mastery,
  MatchScore,
} from "@/lib/genome-core";
import { SKILLS } from "@/lib/genome-core";

export interface GenomeHistoryEntry {
  at: string;
  theta: number;
  match_pct: number;
  mastery: Mastery;
}

interface GenomeState {
  mastery: Mastery | null;
  theta: number | null;
  matchScore: MatchScore | null;
  lastAssessedAt: string | null;
  history: GenomeHistoryEntry[];
}

interface GenomeActions {
  setGenome: (
    mastery: Mastery,
    theta: number,
    match: MatchScore,
    assessedAt?: string,
  ) => void;
  addToHistory: () => void;
  reset: () => void;
}

type GenomeStore = GenomeState & GenomeActions;

const emptyGenome: GenomeState = {
  mastery: null,
  theta: null,
  matchScore: null,
  lastAssessedAt: null,
  history: [],
};

/** Menyimpan snapshot genome dan riwayat asesmen ke localStorage. */
export const useGenomeStore = create<GenomeStore>()(
  persist(
    (set, get) => ({
      ...emptyGenome,
      setGenome: (mastery, theta, matchScore, assessedAt) =>
        set({
          mastery: { ...mastery },
          theta,
          matchScore: { ...matchScore },
          lastAssessedAt: assessedAt ?? new Date().toISOString(),
        }),
      addToHistory: () => {
        const state = get();
        if (
          state.mastery === null ||
          state.theta === null ||
          state.matchScore === null ||
          state.lastAssessedAt === null
        ) {
          return;
        }

        if (state.history.some((entry) => entry.at === state.lastAssessedAt)) {
          return;
        }

        const masterySnapshot = Object.fromEntries(
          SKILLS.map((skill) => [skill, state.mastery?.[skill] ?? 0]),
        ) as Mastery;
        set({
          history: [
            ...state.history,
            {
              at: state.lastAssessedAt,
              theta: state.theta,
              match_pct: state.matchScore.match_pct,
              mastery: masterySnapshot,
            },
          ],
        });
      },
      reset: () => set(emptyGenome),
    }),
    {
      name: "skillgenome-genome",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
