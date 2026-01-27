"use client";

import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/session.store";
import { ThemeToggle } from "@/modules/layout/ThemeToggle";

export const ConsoleTopbar = () => {
  const currentRole = useSessionStore((state) => state.currentRole);
  const roleLabel = currentRole === "SUPER_ADMIN" ? "Admin" : currentRole;

  return (
    <div className="panel-elevated fade-rise flex items-center border-b border-border/60 px-6 py-4">
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            MAQUINA ELECTORAL
          </p>
          <p className="text-sm font-semibold text-foreground">{roleLabel}</p>
        </div>
        <Button variant="outline" size="sm">
          Cerrar sesion
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
};
