import { EventTierraDashboard } from "@/modules/dashboards/events/EventTierraDashboard";

type DashboardTierraPageProps = {
  params: Promise<{ client: string; dashboardId: string }>;
};

export default async function DashboardTierraPage({ params }: DashboardTierraPageProps) {
  const { dashboardId, client } = await params;
  return <EventTierraDashboard eventId={dashboardId} client={client} />;
}
