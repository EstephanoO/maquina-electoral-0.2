export type ThemeMode = "light" | "dark";

export const themeStorageKey = "maquina-electoral-theme";

export const themeModes: ThemeMode[] = ["light"];

export const defaultTheme: ThemeMode = "light";

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light") {
    return "light";
  }

  return null;
};

export const setStoredTheme = (mode: ThemeMode) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, "light");
};

export const applyTheme = (_mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.dataset.theme = "light";
};
