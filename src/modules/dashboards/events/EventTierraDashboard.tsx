"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useEventsStore } from "@/modules/events/events.store";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { EmptyState } from "@/modules/shared/EmptyState";
import { LoadingState } from "@/modules/shared/LoadingState";

const EventMapDashboard = dynamic(
  () => import("@/modules/dashboards/events/EventMapDashboard").then((mod) => mod.EventMapDashboard),
  {
    ssr: false,
    loading: () => <LoadingState title="Cargando dashboard" />,
  },
);

type EventTierraDashboardProps = {
  eventId: string;
  client?: string;
};

export const EventTierraDashboard = ({ eventId, client }: EventTierraDashboardProps) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const event = useEventsStore((state) => state.getEventById(eventId));
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === event?.campaignId),
    [campaigns, event?.campaignId],
  );
  const campaignProfile = event?.campaignId ? campaignProfiles[event.campaignId] : undefined;

  if (!mounted) {
    return <LoadingState title="Cargando evento" />;
  }

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
      eventId={event.id}
      campaignId={event.campaignId}
      clientKey={client}
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
