import { EventTierraDashboard } from "@/modules/dashboards/events/EventTierraDashboard";

type EventDashboardFullscreenPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDashboardFullscreenPage({
  params,
}: EventDashboardFullscreenPageProps) {
  const { eventId } = await params;
  return <EventTierraDashboard eventId={eventId} />;
}
