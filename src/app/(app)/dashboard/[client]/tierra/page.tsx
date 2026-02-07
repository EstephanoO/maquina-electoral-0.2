import { EventTierraDashboard } from "@/ui/dashboards/events/EventTierraDashboard";
import { DashboardAccessGate } from "@/ui/dashboards/DashboardAccessGate";

type DashboardTierraIndexPageProps = {
  params: Promise<{ client: string }>;
};

export default async function DashboardTierraIndexPage({
  params,
}: DashboardTierraIndexPageProps) {
  const { client } = await params;
  return (
    <DashboardAccessGate template="tierra" client={client}>
      <EventTierraDashboard client={client} />
    </DashboardAccessGate>
  );
}
