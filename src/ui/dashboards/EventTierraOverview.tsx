"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";

import { Badge } from "@/ui/primitives/badge";
import { Card } from "@/ui/primitives/card";

type HourPoint = {
  time: string;
  interviews: number;
  total: number;
};

type TerritorySummary = {
  total: number;
  uniqueInterviewers: number;
  latestAt: string | null;
  day: string | null;
  perCandidate: Array<{ name: string; count: number }>;
  perHour: HourPoint[];
  topInterviewers: Array<{ name: string; interviews: number }>;
  lowInterviewers: Array<{ name: string; interviews: number }>;
};

const candidateTargets: Record<string, number> = {
  "Rocio Porras": 520,
  "Giovanna Castagnino": 480,
  "Guillermo Aliaga": 560,
};

const candidateMeta = [
  {
    name: "Rocio Porras",
    slug: "rocio",
    accent: "text-sky-500",
    border: "border-sky-500/40",
    glow: "from-sky-500/10 via-sky-500/5",
  },
  {
    name: "Giovanna Castagnino",
    slug: "giovanna",
    accent: "text-cyan-500",
    border: "border-cyan-500/40",
    glow: "from-cyan-500/10 via-cyan-500/5",
  },
  {
    name: "Guillermo Aliaga",
    slug: "guillermo",
    accent: "text-amber-500",
    border: "border-amber-500/40",
    glow: "from-amber-500/10 via-amber-500/5",
  },
];

const formatNumber = new Intl.NumberFormat("es-PE");
const formatDateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});
const formatTime = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("summary-failed");
  return response.json();
};

const ProgressChart = dynamic(
  () => import("@/ui/dashboards/EventTierraCharts").then((mod) => mod.ProgressChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-md bg-muted/40" />,
  },
);

const TimelineChart = dynamic(
  () => import("@/ui/dashboards/EventTierraCharts").then((mod) => mod.TimelineChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-md bg-muted/40" />,
  },
);

const PaceChart = dynamic(
  () => import("@/ui/dashboards/EventTierraCharts").then((mod) => mod.PaceChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-md bg-muted/40" />,
  },
);

export const EventTierraOverview = () => {
  const { data: summary, error, isLoading } = useSWR<TerritorySummary>(
    "/api/territory-summary",
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
    },
  );
  const hasError = Boolean(error);

  const total = summary?.total ?? 0;
  const activeInterviewers = summary?.uniqueInterviewers ?? 0;
  const perHour: HourPoint[] = summary?.perHour ?? [];
  const averagePerHour = perHour.length > 0 ? Math.round(total / perHour.length) : 0;

  const updatedText = React.useMemo(() => {
    if (!summary?.latestAt) return "Sin datos";
    const updatedAt = new Date(summary.latestAt);
    const diffMinutes = Math.round((Date.now() - updatedAt.getTime()) / 60000);
    if (diffMinutes <= 1) return "Ahora";
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60);
    return `Hace ${diffHours} h`;
  }, [summary?.latestAt]);

  const milestones = React.useMemo(() => {
    if (perHour.length === 0) return [];
    const start = perHour[0];
    const peak = perHour.reduce<HourPoint>(
      (best, point) => (point.interviews > best.interviews ? point : best),
      start,
    );
    const last = perHour[perHour.length - 1];

    return [
      { time: start.time, label: "Inicio operativo", detail: "Despliegue en campo" },
      { time: peak.time, label: "Pico del dia", detail: `${peak.interviews} entrevistas` },
      { time: last.time, label: "Cierre parcial", detail: `${last.total} acumuladas` },
    ];
  }, [perHour]);

  const candidates = candidateMeta.map((candidate) => {
    const count =
      summary?.perCandidate.find(
        (item: { name: string; count: number }) => item.name === candidate.name,
      )?.count ?? 0;
    const target = candidateTargets[candidate.name] ?? 0;
    const percent = target > 0 ? Math.round((count / target) * 100) : 0;
    return { ...candidate, count, target, percent };
  });

  const progressData = candidates.map((candidate) => ({
    name: candidate.name.split(" ")[0],
    completadas: candidate.count,
    objetivo: candidate.target,
  }));

  const kpis = [
    {
      label: "Entrevistas totales",
      value: formatNumber.format(total),
      hint: summary?.day ? `Dia ${summary.day}` : "Sin datos",
    },
    {
      label: "Entrevistadores activos",
      value: formatNumber.format(activeInterviewers),
      hint: "Personal en campo",
    },
    {
      label: "Ritmo por hora",
      value: formatNumber.format(averagePerHour),
      hint: "Promedio horario",
    },
    {
      label: "Ultima carga",
      value: summary?.latestAt ? formatTime.format(new Date(summary.latestAt)) : "-",
      hint: summary?.latestAt ? formatDateTime.format(new Date(summary.latestAt)) : "Sin datos",
    },
  ];

  return (
    <div className="relative space-y-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_58%)]" />
        <div className="absolute inset-0 opacity-40 [background-size:48px_48px] [background-image:linear-gradient(90deg,transparent_0,transparent_47%,rgba(148,163,184,0.3)_48%,transparent_50%,transparent_100%),linear-gradient(0deg,transparent_0,transparent_47%,rgba(148,163,184,0.3)_48%,transparent_50%,transparent_100%)]" />
      </div>

      <Card className="rounded-lg border-border/80 bg-card/85 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Campana de tierra
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              Resumen general - Evento 28 de enero
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seguimiento consolidado de los tres candidatos en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-300">En marcha</Badge>
            <Badge className="bg-secondary text-secondary-foreground">{updatedText}</Badge>
            {isLoading ? (
              <Badge className="bg-muted text-muted-foreground">Cargando</Badge>
            ) : null}
            {hasError ? (
              <Badge className="bg-destructive/15 text-destructive">Error datos</Badge>
            ) : null}
          </div>
        </div>
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dashboard general operativo
            </p>
          </div>
        </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-xl font-semibold text-foreground">{kpi.value}</span>
              <span className="text-xs font-semibold text-sky-500">Live</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recoleccion por candidato
              </p>
              <p className="text-base font-semibold text-foreground">Avance vs. objetivo</p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">Total dia</Badge>
          </div>
          <div className="mt-3 h-[200px]">
            <ProgressChart data={progressData} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.name}
                className={`rounded-md border ${candidate.border} bg-gradient-to-br ${candidate.glow} to-transparent p-3`}
              >
                <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-semibold text-foreground">
                    {formatNumber.format(candidate.count)}
                  </span>
                  <span className={`text-xs font-semibold ${candidate.accent}`}>
                    {candidate.percent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div
                    className={`h-1.5 rounded-full bg-current ${candidate.accent}`}
                    style={{ width: `${candidate.percent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.7rem] text-muted-foreground">
                  <span>Objetivo {formatNumber.format(candidate.target)}</span>
                  <span>{candidate.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Linea del tiempo
              </p>
              <p className="text-base font-semibold text-foreground">Avance horario</p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">Hoy</Badge>
          </div>
          <div className="mt-3 h-[180px]">
            {perHour.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sin datos para la linea de tiempo.
              </div>
            ) : (
              <TimelineChart data={perHour} />
            )}
          </div>
          <div className="mt-3 space-y-2">
            {milestones.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin hitos disponibles.</p>
            ) : (
              milestones.map((item) => (
                <div key={`${item.time}-${item.label}`} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
        <Card className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ritmo por tramo
              </p>
              <p className="text-base font-semibold text-foreground">Entrevistas por hora</p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">Tendencia</Badge>
          </div>
          <div className="mt-3 h-[200px]">
            {perHour.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sin datos para el ritmo horario.
              </div>
            ) : (
              <PaceChart data={perHour} />
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entrevistadores top
                </p>
                <p className="text-base font-semibold text-foreground">Mayor rendimiento</p>
              </div>
            <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-300">Destacados</Badge>
          </div>
            <div className="mt-3 space-y-2">
              {(summary?.topInterviewers ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin datos disponibles.</p>
              ) : (
                summary?.topInterviewers.map((person: { name: string; interviews: number }) => (
                  <div key={person.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">Entrevistas</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatNumber.format(person.interviews)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-lg border-border/80 bg-card/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entrevistadores low
                </p>
                <p className="text-base font-semibold text-foreground">Bajo rendimiento</p>
              </div>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">Atencion</Badge>
          </div>
            <div className="mt-3 space-y-2">
              {(summary?.lowInterviewers ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin datos disponibles.</p>
              ) : (
                summary?.lowInterviewers.map((person: { name: string; interviews: number }) => (
                  <div key={person.name} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">Entrevistas</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatNumber.format(person.interviews)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
