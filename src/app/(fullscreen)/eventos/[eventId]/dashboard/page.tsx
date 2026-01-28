"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { EventMapDashboard } from "@/modules/dashboards/events/EventMapDashboard";
import { useEventsStore } from "@/modules/events/events.store";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { EmptyState } from "@/modules/shared/EmptyState";

export default function EventDashboardFullscreenPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = useEventsStore((state) => state.getEventById(eventId));
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === event?.campaignId),
    [campaigns, event?.campaignId],
  );

  if (!event) {
    return <EmptyState title="Evento no encontrado" description="Revisa el ID." />;
  }

  const candidateLabels =
    event.clients && event.clients.length > 0
      ? event.clients
      : campaign
        ? [campaign.name]
        : [];

  return (
    <EventMapDashboard
      eventTitle={event.name}
      eventSubtitle="Actualizacion en tiempo real"
      candidateLabels={candidateLabels}
      dataUrl={`/api/interviews?eventId=${event.id}`}
    />
  );
}
