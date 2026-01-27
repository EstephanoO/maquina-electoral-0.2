"use client";

import * as React from "react";
import {
  applyTheme,
  defaultTheme,
  getStoredTheme,
  setStoredTheme,
  type ThemeMode,
} from "@/theme/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mode, setModeState] = React.useState<ThemeMode>(defaultTheme);

  React.useEffect(() => {
    const stored = getStoredTheme();
    const nextMode = stored ?? defaultTheme;
    setModeState(nextMode);
    applyTheme(nextMode);
  }, []);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    setStoredTheme(nextMode);
    applyTheme(nextMode);
  }, []);

  const toggle = React.useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
