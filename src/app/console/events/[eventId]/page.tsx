"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEventsStore } from "@/modules/events/events.store";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { EmptyState } from "@/modules/shared/EmptyState";
import { LoadingState } from "@/modules/shared/LoadingState";
import { RoleGate } from "@/modules/shared/RoleGate";
import { toast } from "sonner";

const EventMapDashboard = dynamic(
  () => import("@/modules/dashboards/events/EventMapDashboard").then((mod) => mod.EventMapDashboard),
  {
    ssr: false,
    loading: () => <LoadingState title="Cargando dashboard" />,
  },
);

export default function EventDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const events = useEventsStore((state) => state.events);
  const event = React.useMemo(
    () => events.find((item) => item.id === eventId),
    [events, eventId],
  );
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === event?.campaignId),
    [campaigns, event?.campaignId],
  );
  const closeEvent = useEventsStore((state) => state.closeEvent);
  const copyLink = async () => {
    const link = `${window.location.origin}/e/${eventId}?token=mock`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const handleClose = () => {
    closeEvent(eventId);
    toast.success("Evento cerrado");
  };

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
    <RoleGate action="manage" subject="event">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6">
          <div className="console-actions flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evento
              </p>
              <h2 className="heading-display text-2xl font-semibold text-foreground">
                {event.name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{event.status}</Badge>
              <Button variant="outline" onClick={copyLink}>
                Copy interviewer link
              </Button>
              <Button className="button-glow" onClick={handleClose}>
                Cerrar evento
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/eventos/${eventId}/dashboard`}>Ver fullscreen</Link>
              </Button>
            </div>
          </div>
        </Card>

        <EventMapDashboard
          eventTitle={event.name}
          eventSubtitle="Actualizacion en tiempo real"
          candidateLabels={candidateLabels}
          dataUrl={`/api/interviews?eventId=${event.id}`}
        />
      </div>
    </RoleGate>
  );
}
