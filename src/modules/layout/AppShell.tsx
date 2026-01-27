"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/modules/layout/AppHeader";
import { CandidatePanel } from "@/modules/layout/CandidatePanel";
import { DashboardSidebar } from "@/modules/dashboards/DashboardSidebar";
import { useSessionStore } from "@/stores/session.store";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const role = useSessionStore((state) => state.currentRole);
  const showHeader = role === "SUPER_ADMIN";
  const showSidebar =
    role === "CANDIDATO" || role === "ESTRATEGA" || role === "CONSULTOR";

  return (
    <div className="app-shell text-foreground">
      {showHeader ? <AppHeader /> : null}
      <div className="flex w-full flex-col gap-6 px-6 py-8">
        <CandidatePanel />
        {showSidebar ? (
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <DashboardSidebar />
            <main className="space-y-6">{children}</main>
          </div>
        ) : (
          <main className="space-y-6">{children}</main>
        )}
      </div>
    </div>
  );
};
