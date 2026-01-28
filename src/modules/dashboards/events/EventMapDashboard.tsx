"use client";

import * as React from "react";
import type { MapRef } from "@vis.gl/react-maplibre";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/modules/layout/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { PeruMapPanel } from "@/modules/maps/PeruMapPanel";
import {
  EventRecordsDialog,
  type EventRecord,
} from "@/modules/dashboards/events/EventRecordsDialog";

type EventMapDashboardProps = {
  eventTitle: string;
  eventSubtitle?: string;
  candidateLabels: string[];
  dataUrl?: string;
};

export const EventMapDashboard = ({
  eventTitle,
  eventSubtitle = "Actualizacion en tiempo real",
  candidateLabels,
  dataUrl = "/api/interviews",
}: EventMapDashboardProps) => {
  const mapRef = React.useRef<MapRef | null>(null);
  const [resetMapView, setResetMapView] = React.useState<(() => void) | null>(
    null,
  );
  const fetcher = React.useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("points-failed");
    return response.json() as Promise<{ points: EventRecord[] }>;
  }, []);

  const { data, error, isLoading, mutate } = useSWR<{ points: EventRecord[] }>(
    dataUrl,
    fetcher,
    {
      refreshInterval: 8000,
      revalidateOnFocus: false,
    },
  );

  const buildDeleteUrl = React.useCallback(
    (id: string) => {
      const url = new URL(dataUrl, window.location.origin);
      url.searchParams.set("id", id);
      return url.toString();
    },
    [dataUrl],
  );

  const handleEdit = React.useCallback(
    async (record: EventRecord) => {
      if (!record.id) return;

      await mutate(
        (current) =>
          current
            ? {
                points: current.points.map((item) =>
                  item.id === record.id
                    ? {
                        ...item,
                        candidate: record.candidate ?? item.candidate,
                        name: record.name ?? item.name,
                        phone: record.phone ?? item.phone,
                      }
                    : item,
                ),
              }
            : current,
        false,
      );

      const response = await fetch(dataUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          candidate: record.candidate,
          name: record.name,
          phone: record.phone,
        }),
      });

      if (!response.ok) {
        await mutate();
        return;
      }

      await mutate();
    },
    [dataUrl, mutate],
  );

  const handleDelete = React.useCallback(
    async (record: EventRecord) => {
      if (!record.id) return;
      const confirmDelete = window.confirm(
        "Eliminar este registro? Esta accion es permanente.",
      );
      if (!confirmDelete) return;

      await mutate(
        (current) =>
          current
            ? {
                points: current.points.filter((item) => item.id !== record.id),
              }
            : current,
        false,
      );

      const response = await fetch(buildDeleteUrl(record.id), {
        method: "DELETE",
      });
      if (!response.ok) {
        await mutate();
        return;
      }

      await mutate();
    },
    [buildDeleteUrl, mutate],
  );

  const handleFocusPoint = React.useCallback((record: EventRecord) => {
    if (record.latitude === null || record.longitude === null) return;
    mapRef.current?.flyTo({
      center: [record.longitude, record.latitude],
      zoom: 9,
      essential: true,
    });
  }, []);

  const rows = React.useMemo<EventRecord[]>(() => data?.points ?? [], [data]);
  const points = React.useMemo(
    () =>
      rows
        .filter((point) => point.latitude !== null && point.longitude !== null)
        .map((point) => ({
          lat: point.latitude as number,
          lng: point.longitude as number,
          candidate: point.candidate ?? undefined,
          interviewer: point.interviewer ?? undefined,
          name: point.name ?? undefined,
          createdAt: point.createdAt ?? undefined,
        })),
    [rows],
  );

  const counts = React.useMemo<Record<string, number>>(
    () =>
      rows.reduce<Record<string, number>>((acc, point) => {
        const key = point.candidate ?? "Sin candidato";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [rows],
  );

  const total = React.useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + value, 0),
    [counts],
  );
  const withLocation = points.length;
  const interviewerCounts = React.useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, row) => {
      if (!row.interviewer) return acc;
      acc[row.interviewer] = (acc[row.interviewer] ?? 0) + 1;
      return acc;
    }, {});
  }, [rows]);
  const interviewerRanking = React.useMemo(() => {
    return Object.entries(interviewerCounts).sort((a, b) => b[1] - a[1]);
  }, [interviewerCounts]);
  const topInterviewer = interviewerRanking[0];
  const lowInterviewer = interviewerRanking[interviewerRanking.length - 1];
  const topInterviewers = interviewerRanking.slice(0, 5);
  const topInterviewersForChart = interviewerRanking.slice(0, 3).map(([name]) => name);
  const interviewerColors = ["#6366f1", "#22d3ee", "#f97316"]; 
  const candidateColor = React.useCallback(
    (candidate: string) => {
      if (candidate === candidateLabels[0]) return "#10b981"; // verde rocio
      if (candidate === candidateLabels[1]) return "#3b82f6"; // azul giovanna
      if (candidate === candidateLabels[2]) return "#f97316"; // naranja guillermo
      return "#64748b";
    },
    [candidateLabels],
  );

  const timelineData = React.useMemo(() => {
    const candidates = new Set(candidateLabels);
    const hours = Array.from({ length: 12 }, (_, index) => {
      const hour = index + 8;
      return { label: `${hour.toString().padStart(2, "0")}:00`, hour };
    });
    const counters: Record<string, number[]> = {};
    for (const candidate of candidates) {
      counters[candidate] = new Array(hours.length).fill(0);
    }

    for (const row of rows) {
      if (!row.createdAt || !row.candidate) continue;
      if (!counters[row.candidate]) continue;
      const date = new Date(row.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const hour = date.getHours();
      const index = hour - 8;
      if (index < 0 || index >= hours.length) continue;
      counters[row.candidate][index] += 1;
    }

    return hours.map((item, index) => {
      const entry: Record<string, number | string> = { time: item.label };
      for (const candidate of candidates) {
        entry[candidate] = counters[candidate]?.[index] ?? 0;
      }
      return entry;
    });
  }, [candidateLabels, rows]);

  const interviewerTimelineData = React.useMemo(() => {
    if (topInterviewersForChart.length === 0) return [];
    const hours = Array.from({ length: 12 }, (_, index) => {
      const hour = index + 8;
      return { label: `${hour.toString().padStart(2, "0")}:00`, hour };
    });
    const counters: Record<string, number[]> = {};
    for (const interviewer of topInterviewersForChart) {
      counters[interviewer] = new Array(hours.length).fill(0);
    }

    for (const row of rows) {
      if (!row.createdAt || !row.interviewer) continue;
      if (!counters[row.interviewer]) continue;
      const date = new Date(row.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const hour = date.getHours();
      const index = hour - 8;
      if (index < 0 || index >= hours.length) continue;
      counters[row.interviewer][index] += 1;
    }

    return hours.map((item, index) => {
      const entry: Record<string, number | string> = { time: item.label };
      for (const interviewer of topInterviewersForChart) {
        entry[interviewer] = counters[interviewer]?.[index] ?? 0;
      }
      return entry;
    });
  }, [rows, topInterviewersForChart]);

  const candidateBarData = React.useMemo(() => {
    return candidateLabels.map((candidate) => ({
      name: candidate,
      value: counts[candidate] ?? 0,
    }));
  }, [candidateLabels, counts]);

  const mapStatus = isLoading
    ? "loading"
    : error
      ? "error"
      : points.length > 0
        ? undefined
        : "empty";

  const lastUpdated = React.useMemo(() => {
    const times = rows
      .map((row) => (row.createdAt ? new Date(row.createdAt).getTime() : 0))
      .filter((time) => !Number.isNaN(time));
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [rows]);

  const todayStats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let todayCount = 0;
    let yesterdayCount = 0;

    for (const row of rows) {
      if (!row.createdAt) continue;
      const date = new Date(row.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      if (date >= today) {
        todayCount += 1;
        continue;
      }
      if (date >= yesterday) {
        yesterdayCount += 1;
      }
    }

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      delta: todayCount - yesterdayCount,
    };
  }, [rows]);

  const alerts = React.useMemo(() => {
    const items: string[] = [];
    if (total > 0 && topInterviewer) {
      const percent = Math.round((topInterviewer[1] / total) * 100);
      if (percent >= 50) {
        items.push(`Dependencia alta en entrevistador: ${topInterviewer[0]} (${percent}%).`);
      }
    }
    const topCandidateEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (topCandidateEntry && total > 0) {
      const percent = Math.round((topCandidateEntry[1] / total) * 100);
      if (percent >= 70) {
        items.push(`Sesgo de captura: ${topCandidateEntry[0]} concentra ${percent}%.`);
      }
    }
    if (total > 0 && total < 20) {
      items.push("Muestra baja para conclusiones robustas.");
    }
    return items;
  }, [counts, topInterviewer, total]);

  const nowHour = new Date().getHours();
  const nowLabel = `${nowHour.toString().padStart(2, "0")}:00`;

  return (
    <div className="min-h-screen w-screen bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-5 px-5 py-5">
        <Card className="border-border/60 bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Evento en tierra
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">{eventTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{eventSubtitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Ultima actualizacion: {lastUpdated ? lastUpdated.toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "-"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                En vivo
              </span>
              <ThemeToggle />
              <EventRecordsDialog
                rows={rows}
                title="Registros en campo"
                triggerLabel="Ver registros"
                candidateOptions={candidateLabels}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onFocusPoint={handleFocusPoint}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Distribucion por candidato
            </p>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              En tiempo real
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-4">
            <Card className="border-border/60 bg-card/70 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Total
                </p>
                <span className="text-xs text-muted-foreground">100%</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{total}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40">
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-amber-400/70 via-sky-400/70 to-emerald-400/70" />
              </div>
            </Card>
            {candidateLabels.map((candidate, index) => {
              const totalCandidate = counts[candidate] ?? 0;
              const percent = total > 0 ? Math.round((totalCandidate / total) * 100) : 0;
              const color = index === 0 ? "bg-emerald-500" : index === 1 ? "bg-blue-500" : "bg-orange-500";
              const dot = index === 0 ? "bg-emerald-500" : index === 1 ? "bg-blue-500" : "bg-orange-500";
              return (
                <Card key={candidate} className="border-border/60 bg-card/70 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {candidate}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-semibold text-foreground">{totalCandidate}</p>
                    <EventRecordsDialog
                      rows={rows}
                      title="Registros en campo"
                      triggerLabel="Ver"
                      filterCandidate={candidate}
                      candidateOptions={candidateLabels}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onFocusPoint={handleFocusPoint}
                    />
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div className={`h-1.5 ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative h-[70vh] min-h-[520px] rounded-2xl border border-border/60 bg-card/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,_rgba(15,23,42,0.12),_transparent_35%)] dark:bg-[linear-gradient(180deg,_rgba(2,6,23,0.45),_transparent_35%)]" />
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (resetMapView) {
                    resetMapView();
                    return;
                  }
                  mapRef.current?.flyTo({
                    center: [-75.02, -9.19],
                    zoom: 5.2,
                    essential: true,
                  });
                }}
                className="bg-background/80 backdrop-blur"
              >
                Centrar Peru
              </Button>
            </div>
            <div className="absolute left-4 top-4 z-10 rounded-2xl border border-border/60 bg-background/75 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <p className="font-semibold text-foreground">Mapa Peru</p>
              <p>{withLocation} puntos activos</p>
            </div>
            <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Leyenda
              </p>
              <div className="mt-2 space-y-1">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {candidateLabels[0]}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {candidateLabels[1]}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {candidateLabels[2]}
                </span>
              </div>
            </div>
            <PeruMapPanel
              height={null}
              className="h-full w-full rounded-2xl"
              points={points}
              status={mapStatus}
              mapRef={mapRef}
              onResetViewReady={setResetMapView}
              enablePointTooltip
              renderPointTooltip={(point) => (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {point.candidate ?? "Sin candidato"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entrevistador: {point.interviewer ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hora: {point.createdAt
                      ? new Date(point.createdAt).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              )}
              getPointColor={(point) => {
                if (point.candidate === candidateLabels[0]) return "#10b981";
                if (point.candidate === candidateLabels[1]) return "#3b82f6";
                if (point.candidate === candidateLabels[2]) return "#f97316";
                return "#64748b";
              }}
            />
          </div>

          <aside className="space-y-4">
            <Card className="border-border/60 bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Desempeno entrevistadores
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Top</p>
                    <p className="text-sm font-semibold text-foreground">
                      {topInterviewer ? topInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">
                    {topInterviewer ? topInterviewer[1] : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-sm font-semibold text-foreground">
                      {lowInterviewer ? lowInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-amber-500">
                    {lowInterviewer ? lowInterviewer[1] : 0}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por entrevistador
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      Ver mas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-background text-foreground">
                    <DialogHeader>
                      <DialogTitle>Ranking general de entrevistadores</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border/60">
                      <div className="divide-y divide-border/60">
                        {interviewerRanking.map(([name, count], index) => {
                          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={name} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {index + 1}. {name}
                                </p>
                                <p className="text-xs text-muted-foreground">{percent}% del total</p>
                              </div>
                              <span className="text-sm font-semibold text-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-4 space-y-3">
                {topInterviewers.map(([name, count]) => {
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{name}</span>
                        <span>
                          {count} · {percent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                        <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Comparativo candidatos
                </p>
                <span className="text-xs text-muted-foreground">Barras</span>
              </div>
              <div className="mt-4 h-[160px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={candidateBarData}
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    barCategoryGap={12}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "12px",
                        color: "#e2e8f0",
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={18}>
                      {candidateBarData.map((entry) => (
                        <Cell key={entry.name} fill={candidateColor(entry.name)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </aside>
        </div>

        <Card className="border-border/60 bg-card/70 p-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por candidato
                </p>
                <span className="text-xs text-muted-foreground">Actividad por hora (Hoy)</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Rocio
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Giovanna
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Guillermo
                  </span>
                </div>
              </div>
              <div className="mt-4 h-[220px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <ReferenceLine x={nowLabel} stroke="rgba(148,163,184,0.6)" strokeDasharray="4 4" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "12px",
                        color: "#e2e8f0",
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Line type="monotone" dataKey={candidateLabels[0]} stroke="#10b981" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey={candidateLabels[1]} stroke="#3b82f6" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey={candidateLabels[2]} stroke="#f97316" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por entrevistador
                </p>
                <span className="text-xs text-muted-foreground">Actividad por hora (Hoy)</span>
              </div>
              <div className="mt-4 h-[220px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interviewerTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <ReferenceLine x={nowLabel} stroke="rgba(148,163,184,0.6)" strokeDasharray="4 4" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "12px",
                        color: "#e2e8f0",
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    {topInterviewersForChart.map((interviewer, index) => (
                      <Line
                        key={interviewer}
                        type="monotone"
                        dataKey={interviewer}
                        stroke={interviewerColors[index] ?? "#94a3b8"}
                        strokeWidth={2.2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
