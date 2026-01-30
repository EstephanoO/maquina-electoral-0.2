import * as React from "react";
import {
  DASHBOARD_THEME,
  type DashboardTheme,
  type SentimentDatum,
} from "../constants/dashboard";
import type {
  DailyPoint,
  GrowthSeriesItem,
  LandingsPaymentPoint,
  PanoramaDailyMetric,
  PanoramaPageChart,
  SentimentStackDatum,
} from "../types/dashboard";
import {
  formatDate,
  formatCurrencyPen,
  formatNumber,
  formatPercent,
  formatRatioPercent,
  formatShortDate,
} from "../utils/dashboardFormat";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ResultsPie from "./ResultsPie";

interface DashboardMainProps {
  trendSeries: DailyPoint[];
  reachPeak: DailyPoint | null;
  trendStroke: string;
  theme: DashboardTheme;
  totalInteractionsDisplay: number;
  growthSeries: GrowthSeriesItem[];
  panoramaLoading: boolean;
  panoramaError: string | null;
  topPages: PanoramaPageChart[];
  panoramaDailyActive: PanoramaDailyMetric[];
  sentimentData: SentimentDatum[];
  sentimentStack: SentimentStackDatum[];
  landingsPayments: LandingsPaymentPoint[];
  landingsLoading: boolean;
  landingsError: string | null;
  hasDailyData?: boolean;
  hasPanoramaData?: boolean;
}

export default function DashboardMain({
  trendSeries,
  reachPeak,
  trendStroke,
  theme,
  totalInteractionsDisplay,
  growthSeries,
  panoramaLoading,
  panoramaError,
  topPages,
  panoramaDailyActive,
  sentimentData,
  sentimentStack,
  landingsPayments,
  landingsLoading,
  landingsError,
}: DashboardMainProps) {
  const lastLanding = landingsPayments[landingsPayments.length - 1];
  const firstLanding = landingsPayments[0];
  const landingsChartData = landingsPayments.map((item) => ({
    ...item,
    label: formatShortDate(new Date(item.dateKey)),
  }));
  const landingsTotals = landingsPayments.reduce(
    (acc, item) => ({
      facebook: acc.facebook + item.facebook,
    }),
    { facebook: 0 },
  );
  const landingsCumulative = landingsPayments.reduce<
    Array<LandingsPaymentPoint & { cumFacebook: number; label: string }>
  >((acc, item) => {
    const previous = acc[acc.length - 1];
    const cumFacebook = (previous?.cumFacebook ?? 0) + item.facebook;
    return [
      ...acc,
      {
        ...item,
        label: formatShortDate(new Date(item.dateKey)),
        cumFacebook,
      },
    ];
  }, []);
  const growthBefore = growthSeries.find((item) => item.id === "before");
  const growthAfter = growthSeries.find((item) => item.id === "after");
  const maxGrowthAverage = Math.max(
    1,
    ...growthSeries.map((item) => item.averageReach),
  );
  const growthDeltaRatio =
    growthBefore && growthBefore.averageReach > 0 && growthAfter
      ? (growthAfter.averageReach - growthBefore.averageReach) / growthBefore.averageReach
      : 0;

  React.useEffect(() => {
    if (!landingsPayments.length) return;
    console.info("[landings] registros", landingsPayments);
  }, [landingsPayments]);
  return (
    <div className="w-full px-4 pb-12 pt-6 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Evolucion de alcance
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Linea diaria de alcance e interacciones
              </p>
              <p className="mt-2 text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Total interacciones organicas {formatNumber(totalInteractionsDisplay)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-[0.22em]">
            <span className="flex items-center gap-2" style={{ color: "var(--text-2)" }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#2563eb" }} />
              Alcance
            </span>
            <span className="flex items-center gap-2" style={{ color: "var(--text-2)" }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#f97316" }} />
              Interacciones
            </span>
            <span className="flex items-center gap-2" style={{ color: "var(--text-2)" }}>
              <span
                className="h-0 w-6 border-t-2 border-dashed"
                style={{ borderColor: trendStroke }}
              />
              Tendencia
            </span>
          </div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={trendSeries} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="interactionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                  </linearGradient>
                  <filter id="trendGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(37, 99, 235, 0.18)" vertical={false} />
                <XAxis
                  dataKey="dateKey"
                  tickFormatter={(value) => formatShortDate(new Date(value))}
                  tick={{ fontSize: 11, fill: "#5b6472" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5b6472" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: "#2f6fb8", strokeOpacity: 0.2 }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d0d4dc",
                    background: "#ffffff",
                  }}
                  formatter={(value) => formatNumber(Number(value ?? 0))}
                  labelFormatter={(label) => formatDate(new Date(label as string))}
                />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#reachFill)"
                  name="Alcance"
                />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#interactionFill)"
                  name="Interacciones"
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke={trendStroke}
                  strokeWidth={2.2}
                  strokeOpacity={0.95}
                  dot={false}
                  strokeDasharray="4 4"
                  name="Tendencia de alcance"
                  filter={theme === DASHBOARD_THEME.DARK ? "url(#trendGlow)" : undefined}
                />
                {reachPeak ? (
                  <ReferenceDot
                    x={reachPeak.dateKey}
                    y={reachPeak.reach}
                    r={5}
                    fill="#2563eb"
                    stroke="#1d4ed8"
                    label={{
                      value: "Pico",
                      position: "top",
                      fill: "#1d4ed8",
                      fontSize: 11,
                    }}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Promedio de alcance por publicacion
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {growthSeries.map((entry) => {
              const barWidth = Math.max(
                8,
                Math.round((entry.averageReach / maxGrowthAverage) * 100),
              );
              const isAfter = entry.id === "after";
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-transparent bg-muted/20 p-4 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                        style={{ color: "var(--text-2)" }}
                      >
                        {entry.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--text-1)" }}>
                        {formatNumber(entry.averageReach)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
                        Base
                      </p>
                      <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                        {formatPercent(entry.value)}
                      </p>
                      {isAfter ? (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#16a34a" }}>
                          Despues {growthDeltaRatio >= 0 ? "+" : ""}{formatRatioPercent(growthDeltaRatio)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        background: isAfter
                          ? "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(34,197,94,0.35))"
                          : "linear-gradient(90deg, rgba(56,189,248,0.95), rgba(56,189,248,0.35))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Inversion diaria en landings
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Montos reportados en Facebook vs banco
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
              <span
                className="rounded-full border px-2 py-1"
                style={{ borderColor: "var(--border)" }}
              >
                Solo Facebook
              </span>
            </div>
          </div>
          {landingsLoading ? (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
              Cargando datos de landings...
            </p>
          ) : landingsError ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              {landingsError}
            </p>
          ) : landingsPayments.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
              Sin movimientos disponibles para el periodo.
            </p>
          ) : (
            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-transparent bg-muted/20 p-4 transition">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                    Total Facebook
                  </p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: "var(--text-1)" }}>
                    {formatCurrencyPen(landingsTotals.facebook)}
                  </p>
                </div>
                <div className="rounded-2xl border border-transparent bg-muted/20 p-4 transition">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                    Periodo
                  </p>
                  <p className="mt-2 text-base font-semibold" style={{ color: "var(--text-1)" }}>
                    {firstLanding ? formatDate(new Date(firstLanding.dateKey)) : "-"}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--text-2)" }}>
                    Ultimo registro {lastLanding ? formatDate(new Date(lastLanding.dateKey)) : "-"}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
                <div className="h-64 rounded-2xl border border-transparent bg-muted/20 p-3 transition">
                  <div className="flex items-center justify-between gap-2 px-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                      Diario (Facebook)
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: "#38bdf8" }} />
                        Facebook
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-52">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={landingsChartData} margin={{ left: 0, right: 16, top: 6, bottom: 0 }}>
                        <defs>
                          <linearGradient id="landingsFb" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="landingsBank" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          tickFormatter={(value) => `S/.${formatNumber(Number(value))}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                          contentStyle={{ borderRadius: 12, borderColor: "#d0d4dc", background: "#ffffff" }}
                          formatter={(value, name) => [
                            formatCurrencyPen(Number(value ?? 0)),
                            name === "facebook" ? "Facebook" : "Banco",
                          ]}
                          labelFormatter={(_label, payload) => {
                            const record = payload?.[0]?.payload as { dateKey?: string } | undefined;
                            return record?.dateKey ? formatDate(new Date(record.dateKey)) : "";
                          }}
                        />
                        <Bar
                          dataKey="facebook"
                          name="Facebook"
                          fill="url(#landingsFb)"
                          radius={[6, 6, 0, 0]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-2xl border border-transparent bg-muted/20 p-3 transition">
                  <div className="flex items-center justify-between gap-2 px-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                      Acumulado
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
                      Total Facebook {formatCurrencyPen(landingsTotals.facebook)}
                    </span>
                  </div>
                  <div className="mt-2 h-52">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={landingsCumulative} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="landingsCumTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          tickFormatter={(value) => `S/.${formatNumber(Number(value))}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                          contentStyle={{ borderRadius: 12, borderColor: "#d0d4dc", background: "#ffffff" }}
                          formatter={(value, _name) => [formatCurrencyPen(Number(value ?? 0)), "Total Facebook"]}
                          labelFormatter={(_label, payload) => {
                            const record = payload?.[0]?.payload as { dateKey?: string } | undefined;
                            return record?.dateKey ? formatDate(new Date(record.dateKey)) : "";
                          }}
                        />
                          <Area
                            type="monotone"
                            dataKey="cumFacebook"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fill="url(#landingsCumTotal)"
                          />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Informe panoramico
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Resumen de analitica del sitio
              </p>
            </div>
            <span
              className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-2)", borderColor: "var(--border)" }}
            >
              GA4
            </span>
          </div>
          {panoramaLoading ? (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
              Cargando informe panoramico...
            </p>
          ) : panoramaError ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              {panoramaError}
            </p>
          ) : topPages.length === 0 && panoramaDailyActive.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
              Sin datos disponibles en el informe panoramico.
            </p>
          ) : (
            <div className="mt-3 grid gap-4">
              {topPages.length ? (
                <div className="rounded-2xl bg-muted/30 p-3 ring-0 transition">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: "var(--text-1)" }}
                    >
                      Top paginas por vistas
                    </p>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {formatNumber(topPages.reduce((sum, item) => sum + item.vistas, 0))} vistas
                    </span>
                  </div>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={topPages} layout="vertical" margin={{ left: 6, right: 16 }}>
                        <defs>
                          <linearGradient id="pageViewsFill" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          tickFormatter={(value) => formatNumber(Number(value))}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="tituloCorto"
                          width={160}
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                          wrapperStyle={{ zIndex: 40 }}
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "#d0d4dc",
                            background: "#ffffff",
                            maxWidth: 260,
                            whiteSpace: "normal",
                          }}
                          formatter={(value, _name, props) => {
                            const record = props.payload as PanoramaPageChart | undefined;
                            return `${formatNumber(Number(value))} vistas | ${formatRatioPercent(record?.rebote ?? 0)} rebote`;
                          }}
                          labelFormatter={(_label, payload) => {
                            const record = payload?.[0]?.payload as PanoramaPageChart | undefined;
                            return record?.titulo ?? "";
                          }}
                        />
                        <Bar dataKey="vistas" fill="url(#pageViewsFill)" radius={[6, 10, 10, 6]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
              {panoramaDailyActive.length ? (
                <div className="rounded-2xl bg-muted/30 p-3 ring-0 transition">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: "var(--text-1)" }}
                    >
                      Usuarios activos diarios
                    </p>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: "var(--text-2)" }}
                    >
                      Ultimos {formatNumber(panoramaDailyActive.length)} dias
                    </span>
                  </div>
                  <div className="mt-2 h-40">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={panoramaDailyActive} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="panoramaActiveFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#5b6472" }}
                          tickFormatter={(value) => formatNumber(Number(value))}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                          contentStyle={{ borderRadius: 12, borderColor: "#d0d4dc", background: "#ffffff" }}
                          formatter={(value) => formatNumber(Number(value ?? 0))}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          fill="url(#panoramaActiveFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <ResultsPie />
      </div>

      <div className="mt-6">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Sentimiento de comentarios
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={sentimentStack} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis hide type="number" />
                  <YAxis hide type="category" dataKey="name" />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{ borderRadius: 12, borderColor: "#d0d4dc", background: "#ffffff" }}
                  />
                  <Bar dataKey="positivo" stackId="sent" fill={sentimentData[0].color} />
                  <Bar dataKey="neutral" stackId="sent" fill={sentimentData[1].color} />
                  <Bar dataKey="negativo" stackId="sent" fill={sentimentData[2].color} />
                  <Bar dataKey="mixto" stackId="sent" fill={sentimentData[3].color} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2 text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              {sentimentData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
