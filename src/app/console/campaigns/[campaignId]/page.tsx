"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { campaigns } from "@/db/constants";
import { useEventsStore } from "@/modules/events/events.store";
import { EmptyState } from "@/modules/shared/EmptyState";
import { RoleGate } from "@/modules/shared/RoleGate";
import type { EventStatus } from "@/lib/types";

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Activo",
    className: "bg-emerald-100/70 text-emerald-700 border-emerald-200",
  },
  DRAFT: {
    label: "Borrador",
    className: "bg-amber-100/70 text-amber-700 border-amber-200",
  },
  CLOSED: {
    label: "Cerrado",
    className: "bg-slate-100/70 text-slate-700 border-slate-200",
  },
};

const candidateSlugById: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

const candidateAccentById: Record<string, string> = {
  "cand-rocio": "border-emerald-400",
  "cand-giovanna": "border-sky-400",
  "cand-guillermo": "border-amber-400",
};


export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const campaign = campaigns.find((item) => item.id === campaignId);
  const events = useEventsStore((state) => state.events);
  const createEvent = useEventsStore((state) => state.createEvent);
  const updateEvent = useEventsStore((state) => state.updateEvent);
  const removeEvent = useEventsStore((state) => state.removeEvent);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState({ name: "", date: "" });
  const campaignNames = React.useMemo(
    () => Object.fromEntries(campaigns.map((item) => [item.id, item.name])),
    [],
  );
  const candidateIds = React.useMemo(() => [campaignId], [campaignId]);
  const campaignEvents = React.useMemo(
    () => events.filter((event) => candidateIds.includes(event.campaignId)),
    [events, candidateIds],
  );
  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(date);
  };
  if (!campaign) {
    return <EmptyState title="Campana no encontrada" description="Revisa el ID." />;
  }

  return (
    <RoleGate action="manage" subject="campaign">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                EVENTOS DE CAMPO
              </p>
              <div className="space-y-1">
                {candidateIds.map((candidateId) => (
                  <p
                    key={candidateId}
                    className="text-sm font-semibold uppercase tracking-wide text-foreground"
                  >
                    {campaignNames[candidateId] ?? "Candidato"}
                  </p>
                ))}
              </div>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>Crear evento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    value={newEvent.name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEvent((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Salida de campo 28 de enero"
                  />
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEvent((prev) => ({ ...prev, date: event.target.value }))
                    }
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        if (!newEvent.name || !newEvent.date) return;
                        createEvent({
                          campaignId,
                          name: newEvent.name,
                          status: "DRAFT",
                          startDate: newEvent.date,
                          dashboardTemplate: "tierra",
                        });
                        setNewEvent({ name: "", date: "" });
                        setCreateOpen(false);
                      }}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {campaignEvents.length === 0 ? (
            <EmptyState
              title="Sin eventos"
              description="Crea eventos para esta campana."
            />
          ) : (
            <div className="space-y-4">
              {campaignEvents.map((event) => {
                const status = statusConfig[event.status];
                const candidateName = campaignNames[event.campaignId] ?? "Candidato";
                const candidateAccent =
                  candidateAccentById[event.campaignId] ?? "border-emerald-400";
                const candidateSlug = candidateSlugById[event.campaignId] ?? "rocio";
                return (
                  <Card
                    key={event.id}
                    className={`panel fade-rise card-hover border-l-4 p-5 ${candidateAccent}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {candidateName}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {event.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.startDate)} · Modalidad {event.dashboardTemplate ?? "tierra"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`border ${status.className}`}>{status.label}</Badge>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/${candidateSlug}/tierra`}>Entrar</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {event.status !== "ACTIVE" ? (
                        <Button
                          size="sm"
                          onClick={() => updateEvent(event.id, { status: "ACTIVE" })}
                        >
                          Activar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateEvent(event.id, { status: "DRAFT" })}
                        >
                          Desactivar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeEvent(event.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="panel fade-rise card-hover p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resumen general
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Salida de campo 28 de enero
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Acceso rapido al mapa de cobertura en pantalla completa.
            </p>
            <Button className="mt-4 w-full" asChild>
              <Link href="/eventos/28-enero">Ver mapa full screen</Link>
            </Button>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
