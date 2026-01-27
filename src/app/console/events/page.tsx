"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEventsStore } from "@/modules/events/events.store";
import { useSessionStore } from "@/stores/session.store";
import { can } from "@/lib/rbac";
import { EmptyState } from "@/modules/shared/EmptyState";
import { RoleGate } from "@/modules/shared/RoleGate";

export default function EventsPage() {
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const role = useSessionStore((state) => state.currentRole);
  const events = useEventsStore((state) => state.events);
  const campaignEvents = React.useMemo(
    () => events.filter((event) => event.campaignId === activeCampaignId),
    [events, activeCampaignId],
  );
  const groupedEvents = React.useMemo(
    () => ({
      DRAFT: campaignEvents.filter((event) => event.status === "DRAFT"),
      ACTIVE: campaignEvents.filter((event) => event.status === "ACTIVE"),
      CLOSED: campaignEvents.filter((event) => event.status === "CLOSED"),
    }),
    [campaignEvents],
  );
  const canManage = can("manage", "event", role);

  return (
    <RoleGate action="view" subject="event">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6 stagger-1">
          <div className="console-actions flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Agenda
              </p>
              <h2 className="heading-display text-2xl font-semibold text-foreground">
                Agenda de actividades
              </h2>
            </div>
            {canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/console/campaigns/${activeCampaignId}/events`}>
                    Gestionar agenda
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
        {campaignEvents.length === 0 ? (
          <EmptyState
            title="Sin agenda"
            description="Crea eventos desde la gestion del cliente."
          />
        ) : null}
        {campaignEvents.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {([
              { label: "Borrador", key: "DRAFT" },
              { label: "Activo", key: "ACTIVE" },
              { label: "Cerrado", key: "CLOSED" },
            ] as const).map((column) => (
              <Card key={column.key} className="panel fade-rise card-hover p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{column.label}</p>
                  <Badge variant="outline">{groupedEvents[column.key].length}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {groupedEvents[column.key].length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin eventos.</p>
                  ) : (
                    groupedEvents[column.key].map((event) => (
                      <Card
                        key={event.id}
                        className="border-border/60 bg-background/70 p-3 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-foreground">{event.name}</p>
                        <p className="text-xs text-muted-foreground">Inicio {event.startDate}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/console/events/${event.id}`}>Ver tablero</Link>
                          </Button>
                          {canManage ? (
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/console/events/${event.id}/form`}>
                                Formulario
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </RoleGate>
  );
}
