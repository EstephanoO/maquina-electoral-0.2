"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPanel } from "@/modules/maps/MapPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventsStore } from "@/modules/events/events.store";
import { useResponsesStore } from "@/modules/events/responses.store";
import { EmptyState } from "@/modules/shared/EmptyState";
import { RoleGate } from "@/modules/shared/RoleGate";
import { toast } from "sonner";

const zoneSummary = [
  { zone: "Zona Norte", responses: 42, coverage: "78%" },
  { zone: "Zona Centro", responses: 33, coverage: "64%" },
  { zone: "Zona Sur", responses: 21, coverage: "55%" },
  { zone: "Interior", responses: 18, coverage: "49%" },
  { zone: "Rural", responses: 12, coverage: "38%" },
];

const alerts = [
  "Baja cobertura en zona rural.",
  "Incremento de indecisos en centro.",
  "Actualizar formulario de salud.",
];

export default function EventDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const events = useEventsStore((state) => state.events);
  const event = React.useMemo(
    () => events.find((item) => item.id === eventId),
    [events, eventId],
  );
  const closeEvent = useEventsStore((state) => state.closeEvent);
  const responses = useResponsesStore((state) => state.responses);
  const points = React.useMemo(() => {
    return responses
      .filter((item) => item.eventId === eventId && item.location)
      .map((item) => ({
        lat: item.location?.lat ?? 0,
        lng: item.location?.lng ?? 0,
      }));
  }, [responses, eventId]);
  const summary = React.useMemo(() => {
    const entries = responses.filter((item) => item.eventId === eventId);
    const total = entries.length;
    return {
      total,
      coverage: Math.min(100, total * 4),
      quality: Math.min(100, 60 + total * 2),
      pace: Math.min(100, 40 + total * 3),
    };
  }, [responses, eventId]);
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
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total respuestas", value: summary.total },
            { label: "Cobertura", value: `${summary.coverage}%` },
            { label: "Calidad", value: `${summary.quality}%` },
            { label: "Ritmo", value: `${summary.pace}%` },
          ].map((item, index) => (
            <Card
              key={item.label}
              className={`panel fade-rise card-hover p-4 ${index === 0 ? "stagger-1" : index === 1 ? "stagger-2" : index === 2 ? "stagger-3" : "stagger-4"}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-0 shadow-sm shadow-black/5">
            <MapPanel
              height={null}
              points={points}
              className="h-[calc(100vh-320px)] min-h-[520px] w-full rounded-2xl"
            />
          </div>
          <Card className="panel fade-rise card-hover h-fit p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Formulario asociado
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Ubicacion requerida</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada respuesta debe enviar coordenadas para visualizarse en el mapa.
            </p>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href={`/console/events/${eventId}/form`}>Editar formulario</Link>
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={copyLink}>
              Copiar link entrevistador
            </Button>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="panel fade-rise card-hover p-5">
              <p className="text-sm font-semibold text-foreground">Alertas</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {alerts.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            </Card>
          </TabsContent>
          <TabsContent value="zones" className="mt-4">
            <Card className="panel fade-rise card-hover p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zona</TableHead>
                    <TableHead>Respuestas</TableHead>
                    <TableHead>Cobertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneSummary.map((row) => (
                    <TableRow key={row.zone}>
                      <TableCell>{row.zone}</TableCell>
                      <TableCell>{row.responses}</TableCell>
                      <TableCell>{row.coverage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="quality" className="mt-4">
            <Card className="panel fade-rise card-hover p-5">
              <p className="text-sm text-muted-foreground">
                Calidad de datos estable. Revisar preguntas abiertas.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}
