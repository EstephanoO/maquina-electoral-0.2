"use client";

import { Button } from "@/components/ui/button";
import type { DashboardTheme } from "../constants/dashboard";

export default function ThemeToggleButton({
  theme,
  onToggle,
}: {
  theme: DashboardTheme;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      aria-label="Cambiar tema"
      aria-pressed={theme === "dark"}
      onClick={onToggle}
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full border border-border bg-card text-foreground shadow-[0_18px_36px_rgba(15,23,42,0.25)]"
      variant="ghost"
    >
      <span className="text-lg">{theme === "dark" ? "\u2600" : "\u263e"}</span>
    </Button>
  );
}
