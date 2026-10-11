"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TargetRole =
  | "data_analyst"
  | "data_scientist"
  | "frontend_dev"
  | "product_manager"
  | "business_analyst"
  | "product_analyst";

export type Language = "id" | "en";

export interface ConsentPreferences {
  email_send: boolean;
  public_passport: boolean;
  store_data: boolean;
}

type ConsentPreferenceKey = keyof ConsentPreferences;

interface PrefsState {
  userId: string | null;
  targetRole: TargetRole | null;
  alias: string;
  perceptionScore: 1 | 2 | 3 | 4 | 5 | null;
  consent: ConsentPreferences;
  timerEnabled: boolean;
  reduceMotion: boolean;
  disable3d: boolean;
  language: Language;
}

interface PrefsActions {
  setUserId: (userId: string | null) => void;
  setRole: (role: TargetRole | null) => void;
  setAlias: (alias: string) => void;
  setPerception: (score: PrefsState["perceptionScore"]) => void;
  toggleConsent: (key: ConsentPreferenceKey, enabled: boolean) => void;
  setTimer: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setDisable3d: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
}

type PrefsStore = PrefsState & PrefsActions;

/** Menyimpan preferensi onboarding dan profil lokal sesuai izin pengguna. */
export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      userId: null,
      targetRole: null,
      alias: "",
      perceptionScore: null,
      consent: {
        email_send: false,
        public_passport: false,
        store_data: false,
      },
      timerEnabled: false,
      language: "id",
      setUserId: (userId) => set({ userId }),
      setRole: (targetRole) => set({ targetRole }),
      setAlias: (alias) => set({ alias }),
      setPerception: (perceptionScore) => set({ perceptionScore }),
      toggleConsent: (key, enabled) =>
        set((state) => ({
          consent: { ...state.consent, [key]: enabled },
        })),
      setTimer: (timerEnabled) => set({ timerEnabled }),
      setLanguage: (language) => set({ language }),
      reduceMotion: false,
      disable3d: false,
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setDisable3d: (disable3d) => set({ disable3d }),
    }),
    {
      name: "skillgenome-prefs",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => {
        if (state.consent.store_data) {
          return state;
        }

        return {
          userId: null,
          targetRole: null,
          alias: "",
          perceptionScore: null,
          consent: state.consent,
          timerEnabled: state.timerEnabled,
          reduceMotion: state.reduceMotion,
          disable3d: state.disable3d,
          language: state.language,
        };
      },
    },
  ),
);
