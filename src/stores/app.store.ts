import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AppState = {
  downloadUrl: string;
  setDownloadUrl: (url: string) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      downloadUrl:
        "https://github.com/EstephanoO/goberna-app1/releases/download/gobernav0.1/goberna-territorio.apk",
      setDownloadUrl: (url) => set({ downloadUrl: url }),
    }),
    {
      name: "maquina-app",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = isRecord(persistedState) ? (persistedState as Partial<AppState>) : {};
        return {
          downloadUrl:
            isString(state.downloadUrl)
              ? state.downloadUrl
              : "https://github.com/EstephanoO/goberna-app1/releases/download/gobernav0.1/goberna-territorio.apk",
        } as AppState;
      },
    },
  ),
);
