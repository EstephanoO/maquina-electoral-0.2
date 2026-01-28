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
import { Checkbox } from "@/components/ui/checkbox";
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
  const loadEvents = useEventsStore((state) => state.loadEvents);
  const campaignEvents = React.useMemo(
    () => events.filter((event) => event.campaignId === campaignId),
    [events, campaignId],
  );
  const createEvent = useEventsStore((state) => state.createEvent);
  const createDashboard = useCampaignsStore((state) => state.createDashboard);
  const saveFormSchema = useFormsStore((state) => state.saveFormSchema);
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaign = React.useMemo(
    () => campaigns.find((item) => item.id === campaignId),
    [campaigns, campaignId],
  );
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<EventStatus>("DRAFT");
  const [eventKind, setEventKind] = React.useState<"reunion" | "tierra">("reunion");
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState("");
  const [selectedClients, setSelectedClients] = React.useState<string[]>(
    campaign ? [campaign.name] : [],
  );

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Nombre requerido");
      return;
    }
    if (!startDate) {
      toast.error("Fecha de inicio requerida");
      return;
    }
    if (endDate && endDate < startDate) {
      toast.error("La fecha de fin no puede ser anterior al inicio");
      return;
    }
    if (eventKind === "tierra" && selectedClients.length === 0) {
      toast.error("Selecciona al menos un candidato");
      return;
    }
    const eventId = createId("event");
    const payload = {
      id: eventId,
      campaignId,
      name,
      status,
      startDate,
      endDate: endDate || undefined,
      dashboardTemplate: eventKind === "tierra" ? ("tierra" as DashboardTemplate) : undefined,
      clients: selectedClients.length > 0 ? selectedClients : undefined,
    };
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      toast.error("No se pudo crear el evento");
      return;
    }

    createEvent(payload);
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
    setSelectedClients(campaign ? [campaign.name] : []);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="event-start"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Inicio
                      </label>
                      <Input
                        id="event-start"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="event-end"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Fin (opcional)
                      </label>
                      <Input
                        id="event-end"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        min={startDate}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Candidatos en el evento
                    </p>
                    <div className="space-y-2 rounded-xl border border-border/60 p-3">
                      {campaigns.map((client) => {
                        const checkboxId = `event-client-${client.id}`;
                        return (
                          <div key={client.id} className="flex items-center gap-2">
                            <Checkbox
                              id={checkboxId}
                              checked={selectedClients.includes(client.name)}
                              onCheckedChange={(checked) => {
                                setSelectedClients((prev) =>
                                  checked
                                    ? [...prev, client.name]
                                    : prev.filter((name) => name !== client.name),
                                );
                              }}
                            />
                            <label htmlFor={checkboxId} className="text-sm text-foreground">
                              {client.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
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
                    <p className="text-xs text-muted-foreground">
                      {event.endDate ? `${event.startDate} → ${event.endDate}` : `Inicio ${event.startDate}`}
                    </p>
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
