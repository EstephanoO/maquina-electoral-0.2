import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AppState = {
  downloadUrl: string;
  setDownloadUrl: (url: string) => void;
};

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
    },
  ),
);
