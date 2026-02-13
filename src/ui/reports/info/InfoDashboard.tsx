"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { useOperators } from "@/habilitaciones/hooks/useOperators";

const REPORT_LINKS = [
  {
    id: "habilitar",
    title: "Habilitar contactos",
    description: "Gestiona el acceso a registros y operadores.",
  },
];

type InfoActionSummaryRow = {
  operatorId: string;
  operatorName?: string | null;
  operatorEmail?: string | null;
  action: string;
  count: number;
};

type InfoActionTimerRow = {
  operatorId: string;
  operatorName?: string | null;
  operatorEmail?: string | null;
  metric: "hablado" | "contestado";
  count: number;
  avgSeconds: number | null;
  medianSeconds: number | null;
  p90Seconds: number | null;
};

type InfoActionRecentRow = {
  id: string;
  operatorSlug: string;
  action: string;
  sourceId?: string | null;
  phone?: string | null;
  personName?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  createdAt?: string | null;
};

type InfoActionResponse = {
  summary: InfoActionSummaryRow[];
  unique: InfoActionSummaryRow[];
  timers: InfoActionTimerRow[];
  recent: InfoActionRecentRow[];
};

type InfoUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  hasPassword: boolean;
};

type UsersResponse = {
  users: InfoUser[];
};

type SessionPayload = {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: "admin" | "candidato";
  };
};

const actionLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  hablado: "Hablado",
  no_hablado: "No hablado",
  contestado: "Contestado",
  eliminado: "Eliminado",
  nuevo_contacto: "Nuevo contacto",
  domicilio_agregado: "Domicilio agregado",
  local_agregado: "Local de votacion agregado",
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la actividad.");
  }
  return response.json();
};

const formatDateTime = (timestamp?: string | null) => {
  if (!timestamp) return "";
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatSeconds = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const rounded = Math.max(0, Math.round(value));
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}m ${seconds}s`;
};

export default function InfoDashboard() {
  const { operators: candidates, isLoading, error } = useOperators();
  const { data: sessionData } = useSWR<SessionPayload>("/api/auth/me", fetcher);
  const isAdmin = sessionData?.user?.role === "admin";
  const [range, setRange] = React.useState<"today" | "7d" | "30d">("7d");
  const [logSearch, setLogSearch] = React.useState("");
  const [logPage, setLogPage] = React.useState(1);
  const [logPageSize, setLogPageSize] = React.useState(20);
  const { data: usersData } = useSWR<UsersResponse>(
    isAdmin ? "/api/info/users" : null,
    fetcher,
  );
  const {
    data: actionData,
    error: actionsError,
    isLoading: actionsLoading,
  } = useSWR<InfoActionResponse>(
    `/api/info/8-febrero/actions?range=${range}`,
    fetcher,
    {
      refreshInterval: 5000,
    },
  );
  const reportLinks = React.useMemo(() => REPORT_LINKS, []);
  const activeCandidates = candidates.filter((item) => item.active);
  const orderedCandidates = React.useMemo(
    () => [...candidates].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [candidates],
  );
  const operatorNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    (usersData?.users ?? []).forEach((user) => {
      if (user.role === "admin") return;
      map.set(user.id, user.name);
    });
    if (map.size === 0) {
      (actionData?.unique ?? []).forEach((row) => {
        if (!row.operatorId) return;
        if (!map.has(row.operatorId)) {
          map.set(row.operatorId, row.operatorName || row.operatorEmail || "Operadora");
        }
      });
      (actionData?.timers ?? []).forEach((row) => {
        if (!row.operatorId) return;
        if (!map.has(row.operatorId)) {
          map.set(row.operatorId, row.operatorName || row.operatorEmail || "Operadora");
        }
      });
    }
    return map;
  }, [usersData, actionData]);
  const operatorIds = React.useMemo(() => {
    if ((usersData?.users ?? []).length > 0) {
      return usersData?.users.filter((user) => user.role !== "admin").map((user) => user.id) ?? [];
    }
    return Array.from(
      new Set((actionData?.unique ?? []).map((row) => row.operatorId).filter(Boolean)),
    );
  }, [usersData, actionData]);
  const uniqueByOperator = React.useMemo(() => {
    const summary = new Map<string, Record<string, number>>();
    (actionData?.unique ?? []).forEach((row) => {
      const operatorId = row.operatorId?.trim();
      if (!operatorId) return;
      const current = summary.get(operatorId) ?? {};
      current[row.action] = row.count ?? 0;
      summary.set(operatorId, current);
    });
    return summary;
  }, [actionData]);
  const timersByOperator = React.useMemo(() => {
    const summary = new Map<
      string,
      Partial<Record<"hablado" | "contestado", InfoActionTimerRow>>
    >();
    (actionData?.timers ?? []).forEach((row) => {
      const operatorId = row.operatorId?.trim();
      if (!operatorId) return;
      const current = summary.get(operatorId) ?? {};
      current[row.metric] = row;
      summary.set(operatorId, current);
    });
    return summary;
  }, [actionData]);
  const operatorMetrics = React.useMemo(
    () =>
      operatorIds.map((operatorId) => {
        const uniqueCounts = uniqueByOperator.get(operatorId) ?? {};
        const whatsapp = uniqueCounts.whatsapp ?? 0;
        const hablado = uniqueCounts.hablado ?? 0;
        const contestado = uniqueCounts.contestado ?? 0;
        const eliminado = uniqueCounts.eliminado ?? 0;
        const nuevos = uniqueCounts.nuevo_contacto ?? 0;
        const domicilios = uniqueCounts.domicilio_agregado ?? 0;
        const locales = uniqueCounts.local_agregado ?? 0;
        const contactRate = whatsapp > 0 ? hablado / whatsapp : 0;
        const responseRate = hablado > 0 ? contestado / hablado : 0;
        const discardRate = whatsapp > 0 ? eliminado / whatsapp : 0;
        const timers = timersByOperator.get(operatorId) ?? {};
        const scoreBase = contactRate * 0.45 + responseRate * 0.45 + (1 - discardRate) * 0.1;
        const responsePenalty = (timers.contestado?.avgSeconds ?? 0) / 3600;
        const score = Math.max(0, Math.min(100, Math.round(scoreBase * 100 - responsePenalty * 8)));
        return {
          operatorId,
          name: operatorNameById.get(operatorId) ?? "Operadora",
          counts: { whatsapp, hablado, contestado, eliminado, nuevos, domicilios, locales },
          rates: { contactRate, responseRate, discardRate },
          timers,
          score,
        };
      }),
    [operatorIds, uniqueByOperator, timersByOperator, operatorNameById],
  );
  const filteredLogs = React.useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    if (!query) return actionData?.recent ?? [];
    return (actionData?.recent ?? []).filter((row) => {
      const blob = [
        row.personName,
        row.phone,
        row.actorName,
        row.actorEmail,
        row.action,
        row.operatorSlug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [actionData, logSearch]);
  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / logPageSize));
  const safeLogPage = Math.min(logPage, logTotalPages);
  const pagedLogs = React.useMemo(() => {
    const start = (safeLogPage - 1) * logPageSize;
    return filteredLogs.slice(start, start + logPageSize);
  }, [filteredLogs, safeLogPage, logPageSize]);
  const ratesChartData = React.useMemo(
    () =>
      operatorMetrics.map((operator) => ({
        name: operator.name,
        contacto: Math.round(operator.rates.contactRate * 100),
        respuesta: Math.round(operator.rates.responseRate * 100),
        descarte: Math.round(operator.rates.discardRate * 100),
      })),
    [operatorMetrics],
  );
  const timeChartData = React.useMemo(
    () =>
      operatorMetrics.map((operator) => ({
        name: operator.name,
        promedio: Math.round(operator.timers.hablado?.avgSeconds ?? 0),
        mediana: Math.round(operator.timers.hablado?.medianSeconds ?? 0),
      })),
    [operatorMetrics],
  );
  const aggregate = React.useMemo(() => {
    const totals = {
      whatsapp: 0,
      hablado: 0,
      contestado: 0,
      eliminado: 0,
      nuevos: 0,
      domicilios: 0,
      locales: 0,
    };
    let habladoSum = 0;
    let habladoCount = 0;
    let respuestaSum = 0;
    let respuestaCount = 0;
    operatorMetrics.forEach((operator) => {
      totals.whatsapp += operator.counts.whatsapp;
      totals.hablado += operator.counts.hablado;
      totals.contestado += operator.counts.contestado;
      totals.eliminado += operator.counts.eliminado;
      totals.nuevos += operator.counts.nuevos;
      totals.domicilios += operator.counts.domicilios;
      totals.locales += operator.counts.locales;
      if (operator.timers.hablado?.avgSeconds !== null &&
        operator.timers.hablado?.avgSeconds !== undefined &&
        operator.timers.hablado.count) {
        habladoSum += operator.timers.hablado.avgSeconds * operator.timers.hablado.count;
        habladoCount += operator.timers.hablado.count;
      }
      if (operator.timers.contestado?.avgSeconds !== null &&
        operator.timers.contestado?.avgSeconds !== undefined &&
        operator.timers.contestado.count) {
        respuestaSum += operator.timers.contestado.avgSeconds * operator.timers.contestado.count;
        respuestaCount += operator.timers.contestado.count;
      }
    });
    const contactRate = totals.whatsapp ? totals.hablado / totals.whatsapp : 0;
    const responseRate = totals.hablado ? totals.contestado / totals.hablado : 0;
    const discardRate = totals.whatsapp ? totals.eliminado / totals.whatsapp : 0;
    return {
      totals,
      contactRate,
      responseRate,
      discardRate,
      avgHablado: habladoCount ? habladoSum / habladoCount : null,
      avgRespuesta: respuestaCount ? respuestaSum / respuestaCount : null,
    };
  }, [operatorMetrics]);

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-foreground">
      <header className="border-b border-[#e4e1d9] bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#163960] p-2">
                <img
                  src="/isotipo(2).jpg"
                  alt="GOBERNA"
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Centro INFO
                </p>
                <h1 className="heading-display text-xl font-semibold text-[#0f223d]">
                  Dashboard operativo
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <Link
                  href="/info/admin"
                  className="inline-flex min-h-[34px] items-center rounded-full border border-[#163960]/40 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                >
                  Configuracion operadoras
                </Link>
              ) : null}
              <Badge variant="secondary" className="bg-[#163960]/10 text-[#163960]">
                {activeCandidates.length} activas
              </Badge>
              <Badge variant="secondary" className="bg-[#FFC800]/20 text-[#7a5b00]">
                {candidates.length} total
              </Badge>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { label: "WhatsApp", value: aggregate.totals.whatsapp },
              { label: "Hablado", value: aggregate.totals.hablado },
              { label: "Respondido", value: aggregate.totals.contestado },
              { label: "Archivado", value: aggregate.totals.eliminado },
              { label: "Nuevos", value: aggregate.totals.nuevos },
              { label: "Tiempo resp.", value: formatSeconds(aggregate.avgRespuesta) },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-[#ece7dc] bg-[#fbfaf7] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {kpi.label}
                </p>
                <div className="mt-1 text-lg font-semibold text-[#0f223d]">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 pb-10 pt-6 md:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-[#e4e1d9] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f223d]">
                  Embudo operativo
                </h2>
                <p className="text-xs text-muted-foreground">WhatsApp → Hablado → Respondido → Archivado.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { id: "today", label: "Hoy" },
                  { id: "7d", label: "7 dias" },
                  { id: "30d", label: "30 dias" },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRange(item.id)}
                    className={`min-h-[30px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                      range === item.id
                        ? "border-[#163960] bg-[#163960]/10 text-[#163960]"
                        : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {[
                { label: "WhatsApp", value: aggregate.totals.whatsapp, rate: "Entrada" },
                {
                  label: "Hablado",
                  value: aggregate.totals.hablado,
                  rate: `${formatPercent(aggregate.contactRate)} paso anterior`,
                },
                {
                  label: "Respondido",
                  value: aggregate.totals.contestado,
                  rate: `${formatPercent(aggregate.responseRate)} paso anterior`,
                },
                {
                  label: "Archivado",
                  value: aggregate.totals.eliminado,
                  rate: `${formatPercent(aggregate.discardRate)} paso anterior`,
                },
              ].map((step) => (
                <div key={step.label} className="rounded-xl border border-[#ece7dc] bg-[#fbfaf7] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {step.label}
                  </p>
                  <div className="mt-1 text-lg font-semibold text-[#0f223d]">{step.value}</div>
                  <p className="text-[10px] text-muted-foreground">{step.rate}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                { label: "Nuevos (redes/exterior)", value: aggregate.totals.nuevos },
                { label: "Domicilios agregados", value: aggregate.totals.domicilios },
                { label: "Locales agregados", value: aggregate.totals.locales },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#ece7dc] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {item.label}
                  </p>
                  <div className="mt-1 text-lg font-semibold text-[#0f223d]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[#e4e1d9] bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f223d]">
                Tiempos criticos
              </h3>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-xl border border-[#ece7dc] bg-[#fff8e6] px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a12]">
                      Promedio a respuesta
                    </p>
                    <p className="text-[10px] text-muted-foreground">Objetivo: bajarlo</p>
                  </div>
                  <div className="text-lg font-semibold text-[#b45309]">
                    {formatSeconds(aggregate.avgRespuesta)}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#ece7dc] bg-white px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Promedio a hablado
                    </p>
                    <p className="text-[10px] text-muted-foreground">Tiempo hasta contacto</p>
                  </div>
                  <div className="text-lg font-semibold text-[#163960]">
                    {formatSeconds(aggregate.avgHablado)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4e1d9] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f223d]">
                    Atajos
                  </h3>
                  <p className="text-xs text-muted-foreground">Accesos rapidos.</p>
                </div>
                <Link
                  href="/info/habilitar"
                  className="inline-flex min-h-[32px] items-center rounded-full border border-[#163960]/40 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                >
                  Habilitar
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4e1d9] bg-white px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f223d]">Candidatos</h2>
              <p className="text-xs text-muted-foreground">Acceso directo por candidato.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-3 text-xs text-muted-foreground">Cargando operadoras...</div>
          ) : error ? (
            <div className="mt-3 text-xs text-red-500">{String(error)}</div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {orderedCandidates.map((operator) => (
                <Card key={operator.id} className="border-[#ece7dc] bg-[#fbfaf7]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{operator.name}</CardTitle>
                        <CardDescription>Slug: {operator.slug}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          operator.active
                            ? "border-emerald-500/40 text-emerald-600"
                            : "border-border/60 text-muted-foreground"
                        }
                      >
                        {operator.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Contactos habilitados
                    </div>
                    <Link
                      href={`/info/${operator.slug}`}
                      className="inline-flex min-h-[32px] items-center rounded-full border border-[#163960]/40 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                    >
                      Ver registros
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#e4e1d9] bg-white px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f223d]">
                Actividad de operadoras
              </h2>
              <p className="text-xs text-muted-foreground">Estados marcados y aperturas de WhatsApp.</p>
            </div>
          </div>

          {actionsLoading ? (
            <div className="mt-3 text-xs text-muted-foreground">Cargando actividad...</div>
          ) : actionsError ? (
            <div className="mt-3 text-xs text-red-500">{String(actionsError)}</div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#e4e1d9] bg-white">
                <Table>
                  <TableHeader className="bg-[#f7f6f2]">
                    <TableRow>
                      <TableHead>Operadora</TableHead>
                      <TableHead>Puntaje</TableHead>
                      <TableHead>WA</TableHead>
                      <TableHead>Hab</TableHead>
                      <TableHead>Resp</TableHead>
                      <TableHead>Arch</TableHead>
                      <TableHead>Nuevos</TableHead>
                      <TableHead>Dom</TableHead>
                      <TableHead>Loc</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Respuesta</TableHead>
                      <TableHead>Descarte</TableHead>
                      <TableHead>Prom Hab</TableHead>
                      <TableHead>Med Hab</TableHead>
                      <TableHead>P90 Hab</TableHead>
                      <TableHead>Prom Resp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operatorMetrics.map((operator) => (
                      <TableRow key={operator.operatorId} className="border-[#eee8dc] text-xs">
                        <TableCell className="font-semibold text-foreground">
                          {operator.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex min-w-[44px] items-center justify-center rounded-full border border-[#163960]/20 bg-[#163960]/10 px-2 py-0.5 text-[11px] font-semibold text-[#163960]">
                            {operator.score}
                          </span>
                        </TableCell>
                        <TableCell>{operator.counts.whatsapp}</TableCell>
                        <TableCell>{operator.counts.hablado}</TableCell>
                        <TableCell>{operator.counts.contestado}</TableCell>
                        <TableCell>{operator.counts.eliminado}</TableCell>
                        <TableCell>{operator.counts.nuevos}</TableCell>
                        <TableCell>{operator.counts.domicilios}</TableCell>
                        <TableCell>{operator.counts.locales}</TableCell>
                        <TableCell>{formatPercent(operator.rates.contactRate)}</TableCell>
                        <TableCell>{formatPercent(operator.rates.responseRate)}</TableCell>
                        <TableCell>{formatPercent(operator.rates.discardRate)}</TableCell>
                        <TableCell>{formatSeconds(operator.timers.hablado?.avgSeconds ?? null)}</TableCell>
                        <TableCell>{formatSeconds(operator.timers.hablado?.medianSeconds ?? null)}</TableCell>
                        <TableCell>{formatSeconds(operator.timers.hablado?.p90Seconds ?? null)}</TableCell>
                        <TableCell>{formatSeconds(operator.timers.contestado?.avgSeconds ?? null)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-[#ece7dc] bg-[#fbfaf7]">
                  <CardHeader>
                    <CardTitle className="text-sm">Tasas por operadora</CardTitle>
                    <CardDescription>Contacto, respuesta y descarte</CardDescription>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={ratesChartData} margin={{ left: 0, right: 12, top: 10 }}>
                        <CartesianGrid stroke="rgba(22,57,96,0.12)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(22,57,96,0.08)" }}
                          contentStyle={{
                            borderRadius: 10,
                            borderColor: "#d0d4dc",
                            background: "#ffffff",
                          }}
                          formatter={(value, name) => [`${value}%`, name]}
                        />
                        <Bar dataKey="contacto" name="Contacto" fill="#163960" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="respuesta" name="Respuesta" fill="#25D366" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="descarte" name="Descarte" fill="#f97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-[#ece7dc] bg-[#fbfaf7]">
                  <CardHeader>
                    <CardTitle className="text-sm">Tiempo a hablado</CardTitle>
                    <CardDescription>Promedio y mediana por operadora</CardDescription>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={timeChartData} margin={{ left: 0, right: 12, top: 10 }}>
                        <CartesianGrid stroke="rgba(22,57,96,0.12)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value}s`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(22,57,96,0.08)" }}
                          contentStyle={{
                            borderRadius: 10,
                            borderColor: "#d0d4dc",
                            background: "#ffffff",
                          }}
                          formatter={(value, name) => [`${value}s`, name]}
                        />
                        <Bar dataKey="promedio" name="Promedio" fill="#FFC800" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="mediana" name="Mediana" fill="#163960" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={logSearch}
                    onChange={(event) => {
                      setLogSearch(event.target.value);
                      setLogPage(1);
                    }}
                    placeholder="Buscar nombre, telefono o accion"
                    className="h-8 min-w-[220px] rounded-full border border-[#e4e1d9] bg-white px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {filteredLogs.length} resultados
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Filas
                  </span>
                  <select
                    value={logPageSize}
                    onChange={(event) => {
                      setLogPageSize(Number(event.target.value));
                      setLogPage(1);
                    }}
                    className="h-8 rounded-full border border-[#e4e1d9] bg-white px-2 text-xs text-foreground"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLogPage((page) => Math.max(1, page - 1))}
                      className="h-8 rounded-full border border-[#e4e1d9] px-3 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {safeLogPage} / {logTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogPage((page) => Math.min(logTotalPages, page + 1))}
                      className="h-8 rounded-full border border-[#e4e1d9] px-3 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#e4e1d9] bg-white">
                <Table>
                  <TableHeader className="bg-[#f7f6f2]">
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Operadora</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Ciudadano</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-sm">
                          Sin actividad registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedLogs.map((row) => (
                        <TableRow key={row.id} className="border-[#eee8dc]">
                          <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                          <TableCell className="capitalize">
                            {row.actorName || row.actorEmail || "Operadora"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#e4e1d9] text-foreground">
                              {actionLabels[row.action] ?? row.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {row.personName || "-"}
                          </TableCell>
                          <TableCell>{row.phone || "-"}</TableCell>
                          <TableCell className="whitespace-normal">
                            {row.actorName || row.actorEmail || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
