"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { useSessionStore } from "@/stores/session.store";

const dashboardTemplates = [
  { id: "tierra", label: "Tierra" },
  { id: "mar", label: "Mar" },
  { id: "aire", label: "Aire" },
];

const candidateRoutes: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export const DashboardSidebar = () => {
  const params = useParams();
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const dashboardsByCampaign = useCampaignsStore((state) => state.dashboardsByCampaign);
  const activeTemplate = (params?.template as string) ?? "tierra";
  const activeClient = (params?.client as string) ?? "";
  const candidateSlug = candidateRoutes[activeCampaignId] ?? "guillermo";
  const resolvedClient =
    activeClient && activeClient !== "undefined" ? activeClient : candidateSlug;
  const dashboards = dashboardsByCampaign[activeCampaignId] ?? [];
  const enabledTemplates = dashboards
    .filter((dashboard) => dashboard.status === "ACTIVE")
    .map((dashboard) => dashboard.template);
  const visibleTemplates = dashboardTemplates.filter((template) =>
    enabledTemplates.includes(template.id as "tierra" | "mar" | "aire"),
  );

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dashboards
        </p>
        <div className="mt-4 space-y-2">
          {visibleTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              Sin dashboards habilitados. Solicita activacion al consultor.
            </div>
          ) : null}
          {visibleTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/${resolvedClient}/${template.id}`}
              className={`flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm font-semibold transition ${
                activeTemplate === template.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/80 text-foreground hover:bg-background"
              }`}
            >
              <span>{template.label}</span>
              {activeTemplate === template.id ? (
                <Badge className="bg-white/20 text-primary-foreground">Activo</Badge>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
