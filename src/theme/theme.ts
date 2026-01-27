export type ThemeMode = "light" | "dark";

export const themeStorageKey = "maquina-electoral-theme";

export const themeModes: ThemeMode[] = ["light", "dark"];

export const defaultTheme: ThemeMode = "dark";

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
};

export const setStoredTheme = (mode: ThemeMode) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, mode);
};

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
};
