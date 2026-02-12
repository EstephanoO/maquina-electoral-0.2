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
        const contactRate = whatsapp > 0 ? hablado / whatsapp : 0;
        const responseRate = hablado > 0 ? contestado / hablado : 0;
        const discardRate = whatsapp > 0 ? eliminado / whatsapp : 0;
        const timers = timersByOperator.get(operatorId) ?? {};
        return {
          operatorId,
          name: operatorNameById.get(operatorId) ?? "Operadora",
          counts: { whatsapp, hablado, contestado, eliminado },
          rates: { contactRate, responseRate, discardRate },
          timers,
        };
      }),
    [operatorIds, uniqueByOperator, timersByOperator, operatorNameById],
  );
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
      <header className="panel-elevated fade-rise border-b border-border/60 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#163960] p-2">
              <img
                src="/isotipo(2).jpg"
                alt="GOBERNA"
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Centro INFO
              </p>
              <h1 className="heading-display text-2xl font-semibold text-foreground md:text-3xl">
                Dashboard de reportes
              </h1>
              <p className="text-sm text-muted-foreground">
                Accesos rapidos a operadores y reportes especiales.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <Link
                href="/info/admin"
                className="inline-flex min-h-[40px] items-center rounded-full border border-[#163960]/40 px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
              >
                Configuracion operadoras
              </Link>
            ) : null}
            <Badge variant="secondary" className="bg-[#163960]/10 text-[#163960]">
              {activeCandidates.length} candidatos activos
            </Badge>
            <Badge variant="secondary" className="bg-[#FFC800]/20 text-[#7a5b00]">
              {candidates.length} en total
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-10 pt-8 md:px-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 px-5 py-6 shadow-lg shadow-black/5 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Atajos principales</h2>
              <p className="text-sm text-muted-foreground">
                Secciones clave para habilitar y revisar reportes.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reportLinks.map((report) => (
              <Card key={report.id} className="border-border/60 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0" />
              </Card>
            ))}
          </div>
        </section>

        <section className="panel fade-rise rounded-3xl border border-border/70 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Candidatos</h2>
              <p className="text-sm text-muted-foreground">
                Acceso directo a los registros habilitados por candidato.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Cargando operadoras...</div>
          ) : error ? (
            <div className="mt-4 text-sm text-red-500">{String(error)}</div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {orderedCandidates.map((operator) => (
                <Card key={operator.id} className="border-border/60 bg-card/70">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{operator.name}</CardTitle>
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
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Contactos habilitados
                    </div>
                    <Link
                      href={`/info/${operator.slug}`}
                      className="inline-flex min-h-[40px] items-center rounded-full border border-[#163960]/40 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                    >
                      Ver registros
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="panel fade-rise rounded-3xl border border-border/70 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Actividad de operadoras</h2>
              <p className="text-sm text-muted-foreground">
                Estados marcados y aperturas de WhatsApp.
              </p>
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
                  className={`min-h-[36px] rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
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

          {actionsLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Cargando actividad...</div>
          ) : actionsError ? (
            <div className="mt-4 text-sm text-red-500">{String(actionsError)}</div>
          ) : (
            <div className="mt-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {operatorMetrics.map((operator) => (
                  <Card key={operator.operatorId} className="border-border/60 bg-card/70">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">{operator.name}</CardTitle>
                        <Badge variant="secondary" className="bg-[#163960]/10 text-[#163960]">
                          {operator.counts.whatsapp} registros
                        </Badge>
                      </div>
                      <CardDescription>Volumen, tasas y tiempos</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm">
                      <div className="grid gap-2">
                        {[
                          { label: "WhatsApp", value: operator.counts.whatsapp },
                          { label: "Hablados", value: operator.counts.hablado },
                          { label: "Respondieron", value: operator.counts.contestado },
                          { label: "Eliminados", value: operator.counts.eliminado },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tasa de contacto</span>
                          <span className="font-semibold text-foreground">
                            {formatPercent(operator.rates.contactRate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tasa de respuesta</span>
                          <span className="font-semibold text-foreground">
                            {formatPercent(operator.rates.responseRate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tasa de descarte</span>
                          <span className="font-semibold text-foreground">
                            {formatPercent(operator.rates.discardRate)}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Promedio a hablado</span>
                          <span className="font-semibold text-foreground">
                            {formatSeconds(operator.timers.hablado?.avgSeconds ?? null)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Mediana a hablado</span>
                          <span className="font-semibold text-foreground">
                            {formatSeconds(operator.timers.hablado?.medianSeconds ?? null)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">P90 a hablado</span>
                          <span className="font-semibold text-foreground">
                            {formatSeconds(operator.timers.hablado?.p90Seconds ?? null)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Promedio a respuesta</span>
                          <span className="font-semibold text-foreground">
                            {formatSeconds(operator.timers.contestado?.avgSeconds ?? null)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                  <CardHeader>
                    <CardTitle className="text-base">Tasas por operadora</CardTitle>
                    <CardDescription>Contacto, respuesta y descarte</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={ratesChartData} margin={{ left: 0, right: 12, top: 10 }}>
                        <CartesianGrid stroke="rgba(22,57,96,0.12)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(22,57,96,0.08)" }}
                          contentStyle={{
                            borderRadius: 12,
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
                <Card className="border-border/60 bg-card/70">
                  <CardHeader>
                    <CardTitle className="text-base">Tiempo a hablado</CardTitle>
                    <CardDescription>Promedio y mediana por operadora</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={timeChartData} margin={{ left: 0, right: 12, top: 10 }}>
                        <CartesianGrid stroke="rgba(22,57,96,0.12)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value}s`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(22,57,96,0.08)" }}
                          contentStyle={{
                            borderRadius: 12,
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

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <Table>
                  <TableHeader className="bg-card/80">
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
                    {(actionData?.recent ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-sm">
                          Sin actividad registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (actionData?.recent ?? []).map((row) => (
                        <TableRow key={row.id} className="border-border/60">
                          <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                          <TableCell className="capitalize">
                              {row.actorName || row.actorEmail || "Operadora"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border/60 text-foreground">
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
