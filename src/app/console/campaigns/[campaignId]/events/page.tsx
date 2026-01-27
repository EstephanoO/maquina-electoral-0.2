"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventsStore } from "@/modules/events/events.store";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { useFormsStore } from "@/modules/events/forms.store";
import type { DashboardTemplate, EventStatus } from "@/lib/types";
import { createId } from "@/db/mock-helpers";
import { EmptyState } from "@/modules/shared/EmptyState";
import { RoleGate } from "@/modules/shared/RoleGate";
import { toast } from "sonner";

export default function CampaignEventsPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const events = useEventsStore((state) => state.events);
  const campaignEvents = React.useMemo(
    () => events.filter((event) => event.campaignId === campaignId),
    [events, campaignId],
  );
  const createEvent = useEventsStore((state) => state.createEvent);
  const createDashboard = useCampaignsStore((state) => state.createDashboard);
  const saveFormSchema = useFormsStore((state) => state.saveFormSchema);
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<EventStatus>("DRAFT");
  const [eventKind, setEventKind] = React.useState<"reunion" | "tierra">("reunion");

  const handleCreate = () => {
    if (!name) {
      toast.error("Nombre requerido");
      return;
    }
    const eventId = createEvent({
      campaignId,
      name,
      status,
      startDate: new Date().toISOString().slice(0, 10),
      dashboardTemplate: eventKind === "tierra" ? "tierra" : undefined,
    });
    if (eventKind === "tierra") {
      saveFormSchema({
        eventId,
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: createId("field"),
            type: "location",
            label: "Ubicacion",
            required: true,
          },
        ],
      });
      createDashboard(campaignId, {
        template: "tierra" as DashboardTemplate,
        status: "ACTIVE",
        eventId,
        name,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setName("");
    setEventKind("reunion");
    toast.success("Evento creado");
  };

  return (
    <RoleGate action="manage" subject="event">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6 stagger-1">
          <div className="console-actions flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Eventos
              </p>
              <h2 className="heading-display text-2xl font-semibold text-foreground">
                Gestion de eventos
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog>
              <DialogTrigger asChild>
                <Button className="button-glow">Crear evento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nuevo evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="event-name"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Nombre
                    </label>
                    <Input
                      id="event-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Encuesta Abril"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="event-status"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Estado
                    </label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as EventStatus)}
                    >
                      <SelectTrigger id="event-status">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="CLOSED">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="event-kind"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Tipo de evento
                    </label>
                    <Select
                      value={eventKind}
                      onValueChange={(value) => setEventKind(value as "reunion" | "tierra")}
                    >
                      <SelectTrigger id="event-kind">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reunion">Reunion / Agenda</SelectItem>
                        <SelectItem value="tierra">Tierra (con mapa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="button-glow" onClick={handleCreate}>
                    Guardar evento
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {campaignEvents.length === 0 ? (
          <EmptyState
            title="Sin eventos"
            description="Crea el primer evento para esta campana."
          />
        ) : null}
        {campaignEvents.length > 0 ? (
          <div className="space-y-4">
            {campaignEvents.map((event, index) => (
              <Card
                key={event.id}
                className={`panel fade-rise card-hover p-5 ${index % 3 === 0 ? "stagger-1" : index % 3 === 1 ? "stagger-2" : "stagger-3"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.name}</p>
                    <p className="text-xs text-muted-foreground">Inicio {event.startDate}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{event.status}</Badge>
                    <Button size="sm" asChild>
                      <Link href={`/console/events/${event.id}`}>Ver dashboard</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/console/events/${event.id}/form`}>Form builder</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </RoleGate>
  );
}
