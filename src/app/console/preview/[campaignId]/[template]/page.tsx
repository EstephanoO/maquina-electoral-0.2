import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { campaigns } from "@/db/constants";
import { MapPanel } from "@/modules/maps/MapPanel";
import { KpiGrid } from "@/modules/dashboards/KpiGrid";
import { SummaryCard } from "@/modules/dashboards/SummaryCard";
import { TimelineCard } from "@/modules/dashboards/TimelineCard";
import { ClientHeader } from "@/modules/dashboards/ClientHeader";
import { DashboardCatalog } from "@/modules/dashboards/DashboardCatalog";
import { RoleGate } from "@/modules/shared/RoleGate";
import { TierraSidebar } from "@/modules/dashboards/TierraSidebar";
import { DashboardAccessGate } from "@/modules/dashboards/DashboardAccessGate";

type PreviewPageProps = {
  params: Promise<{ campaignId: string; template: string }>;
};

const templates = new Set(["tierra", "mar", "aire"]);
const candidateRoutes: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { campaignId, template } = await params;
  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign || !templates.has(template)) {
    redirect("/console/campaigns");
  }

  const clientSlug = candidateRoutes[campaignId] ?? "guillermo";
  const resolvedTemplate = template as "tierra" | "mar" | "aire";
  const isTierra = resolvedTemplate === "tierra";

  return (
    <RoleGate action="manage" subject="campaign">
      <DashboardAccessGate
        template={resolvedTemplate}
        campaignId={campaignId}
        allowDraft
      >
        <div className="space-y-6">
          <Card className="panel fade-rise card-hover sticky top-4 z-30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Previsualizacion
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  Dashboard · {campaign.name}
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/console/campaigns/${campaignId}`}>
                  Salir de previsualizacion
                </Link>
              </Button>
            </div>
          </Card>
          <ClientHeader activeId={clientSlug} activeTemplate={resolvedTemplate} />
          {isTierra ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-0 shadow-sm shadow-black/5">
                <MapPanel
                  height={null}
                  className="h-[calc(100vh-300px)] min-h-[560px] w-full rounded-2xl"
                />
              </div>
              <div className="lg:sticky lg:top-6 lg:self-start">
                <TierraSidebar />
              </div>
            </div>
          ) : (
            <>
              <DashboardCatalog />
              <KpiGrid />
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <SummaryCard />
                <TimelineCard />
              </div>
            </>
          )}
        </div>
      </DashboardAccessGate>
    </RoleGate>
  );
}
