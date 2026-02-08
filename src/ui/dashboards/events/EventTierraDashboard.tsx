"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useCampaignsStore } from "@/campaigns/store";
import { useSessionStore } from "@/stores/session.store";
import { EmptyState } from "@/ui/shared/EmptyState";
import { LoadingState } from "@/ui/shared/LoadingState";

const EventMapDashboard = dynamic(
  () =>
    import("@/dashboards/events/containers/EventMapDashboard").then(
      (mod) => mod.EventMapDashboard,
    ),
  {
    ssr: false,
    loading: () => <LoadingState title="Cargando dashboard" />,
  },
);

type EventTierraDashboardProps = {
  client?: string;
};

const slugToCampaignId: Record<string, string> = {
  rocio: "cand-rocio",
  giovanna: "cand-giovanna",
  guillermo: "cand-guillermo",
};

export const EventTierraDashboard = ({ client }: EventTierraDashboardProps) => {
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const resolvedCampaignId = client ? slugToCampaignId[client] : activeCampaignId;
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === resolvedCampaignId),
    [campaigns, resolvedCampaignId],
  );
  const campaignProfile = resolvedCampaignId ? campaignProfiles[resolvedCampaignId] : undefined;

  if (!campaign) {
    return <EmptyState title="Dashboard no disponible" description="Revisa el cliente." />;
  }

  const candidateLabels = campaign ? [campaign.name] : [];


  return (
    <EventMapDashboard
      eventTitle={campaign.name}
      candidateLabels={candidateLabels}
      campaignId={campaign.id}
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
      dataUrl={`/api/interviews${client ? `?client=${client}` : ""}`}
    />
  );
};
