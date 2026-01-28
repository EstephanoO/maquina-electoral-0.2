import { redirect } from "next/navigation";
import { MapLivePanel } from "@/modules/maps/MapLivePanel";
import { KpiGrid } from "@/modules/dashboards/KpiGrid";
import { SummaryCard } from "@/modules/dashboards/SummaryCard";
import { TimelineCard } from "@/modules/dashboards/TimelineCard";
import { ClientHeader } from "@/modules/dashboards/ClientHeader";
import { DashboardCatalog } from "@/modules/dashboards/DashboardCatalog";
import { TierraSidebar } from "@/modules/dashboards/TierraSidebar";
import { DashboardAccessGate } from "@/modules/dashboards/DashboardAccessGate";

type DashboardPageProps = {
  params: Promise<{ client: string; template: string }>;
};

const templates = new Set(["tierra", "mar", "aire"]);

export default async function DashboardTemplatePage({ params }: DashboardPageProps) {
  const { client, template } = await params;

  if (!templates.has(template)) {
    redirect(`/dashboard/${client}/tierra`);
  }

  const resolvedTemplate = template as "tierra" | "mar" | "aire";
  const isTierra = resolvedTemplate === "tierra";

  return (
    <DashboardAccessGate template={resolvedTemplate} client={client}>
      {isTierra ? (
        <div className="relative space-y-6 lg:pr-[280px]">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-0 shadow-sm shadow-black/5">
            <MapLivePanel
              client={client}
              className="h-[calc(100vh-220px)] min-h-[560px] w-full rounded-2xl"
            />
          </div>
          <div className="lg:fixed lg:right-0 lg:top-[52px] lg:z-20 lg:h-[calc(100vh-52px)] lg:w-[280px] lg:border-l lg:border-border/60 lg:bg-background">
            <TierraSidebar className="h-full" client={client} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ClientHeader activeId={client} activeTemplate={resolvedTemplate} />
          <DashboardCatalog />
          <KpiGrid />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <SummaryCard />
            <TimelineCard />
          </div>
        </div>
      )}
    </DashboardAccessGate>
  );
}
