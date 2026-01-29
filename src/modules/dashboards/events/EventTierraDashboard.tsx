"use client";

import * as React from "react";
import { EventMapDashboard } from "@/modules/dashboards/events/EventMapDashboard";
import { useEventsStore } from "@/modules/events/events.store";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { EmptyState } from "@/modules/shared/EmptyState";

type EventTierraDashboardProps = {
  eventId: string;
  client?: string;
};

export const EventTierraDashboard = ({ eventId, client }: EventTierraDashboardProps) => {
  const event = useEventsStore((state) => state.getEventById(eventId));
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === event?.campaignId),
    [campaigns, event?.campaignId],
  );
  const campaignProfile = event?.campaignId ? campaignProfiles[event.campaignId] : undefined;

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
        campaignId={event.campaignId}
        candidateProfile={
          campaignProfile
            ? {
              name: campaign?.name ?? candidateLabels[0] ?? "",
              party: campaignProfile.party,
              role: campaignProfile.role,
              number: campaignProfile.number,
              image: campaignProfile.image,
            }
          : undefined
      }
      dataGoal={campaignProfile?.goal}
      dataUrl={`/api/interviews?eventId=${event.id}${client ? `&client=${client}` : ""}&includeUnassigned=1`}
    />
  );
};
