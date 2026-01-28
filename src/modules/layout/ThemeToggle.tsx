"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import { useTheme } from "@/theme/ThemeProvider";

export const ThemeToggle = () => {
  const { mode, setMode, toggle } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-border/60 bg-background/80"
          aria-label="Alternar tema"
        >
          {mode === "dark" ? <Moon /> : <Sun />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={toggle}>Alternar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("light")}>Claro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("dark")}>Oscuro</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
