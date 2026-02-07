"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppHeader } from "@/ui/layout/AppHeader";
import { CandidatePanel } from "@/ui/layout/CandidatePanel";
import { DashboardSidebar } from "@/ui/dashboards/DashboardSidebar";
import { useSessionStore } from "@/stores/session.store";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = useSessionStore((state) => state.currentRole);
  const isPreview = searchParams?.get("preview") === "1";
  const showHeader = role === "SUPER_ADMIN" && !isPreview;
  const showSidebarBase =
    role === "CANDIDATO" || role === "ESTRATEGA" || role === "CONSULTOR";
  const pathParts = pathname?.split("/").filter(Boolean) ?? [];
  const isClientCatalog = pathParts[0] === "dashboard" && pathParts.length === 2;
  const isTierraDashboard =
    (pathParts[0] === "dashboard" && pathParts[2] === "tierra") ||
    (pathParts[0] === "eventos" && pathParts[2] === "dashboard");
  const isAnalyticsDashboard = pathParts[0] === "dashboard" && pathParts[2] === "analytics";
  const isFullBleed = isTierraDashboard || isAnalyticsDashboard;
  const showSidebar = showSidebarBase && !isClientCatalog && !isAnalyticsDashboard;
  const showCandidatePanel = !isTierraDashboard && !isAnalyticsDashboard;

  const shellClassName = isAnalyticsDashboard
    ? "text-foreground"
    : "app-shell text-foreground";

  return (
    <div className={shellClassName}>
      {showHeader ? <AppHeader /> : null}
      <div
        className={`flex w-full flex-col ${
          isFullBleed ? "gap-0 px-0 py-0" : "gap-6 px-6 py-8"
        }`}
      >
        {showCandidatePanel ? <CandidatePanel /> : null}
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
