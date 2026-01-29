import CampaignsPie from "./CampaignsPie";
import GuillermoMap, { type MapData } from "./GuillermoMap";
import {
  DASHBOARD_THEME,
  type DashboardTheme,
  type SentimentDatum,
} from "../constants/dashboard";
import type {
  DailyPoint,
  GrowthSeriesItem,
  PanoramaCity,
  PanoramaPageChart,
  SentimentStackDatum,
} from "../types/dashboard";
import {
  formatDate,
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

interface DashboardMainProps {
  mapData: MapData | null;
  mapError: string | null;
  trendSeries: DailyPoint[];
  reachPeak: DailyPoint | null;
  trendStroke: string;
  theme: DashboardTheme;
  totalInteractionsDisplay: number;
  growthSeries: GrowthSeriesItem[];
  panoramaLoading: boolean;
  panoramaError: string | null;
  topPages: PanoramaPageChart[];
  topCities: PanoramaCity[];
  sentimentData: SentimentDatum[];
  sentimentStack: SentimentStackDatum[];
  hasDailyData?: boolean;
  hasPanoramaData?: boolean;
  hasCitiesData?: boolean;
}

export default function DashboardMain({
  mapData,
  mapError,
  trendSeries,
  reachPeak,
  trendStroke,
  theme,
  totalInteractionsDisplay,
  growthSeries,
  panoramaLoading,
  panoramaError,
  topPages,
  topCities,
  sentimentData,
  sentimentStack,
}: DashboardMainProps) {
  return (
    <div className="w-full px-4 pb-12 pt-6 md:px-6">
      <div className="mb-6">
        <GuillermoMap data={mapData} error={mapError} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
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

        <div className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{ color: "var(--text-1)" }}
              >
                Promedio de alcance por publicacion
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Antes vs despues del corte
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                Base: porcentaje del promedio total
              </p>
            </div>
          </div>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={growthSeries} layout="vertical" margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthBefore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="growthAfter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#5b6472" }}
                  tickFormatter={(value) => formatPercent(Number(value))}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5b6472" }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d0d4dc",
                    background: "#ffffff",
                  }}
                  formatter={(value) => formatPercent(Number(value ?? 0))}
                />
                <Bar dataKey="value" radius={[8, 12, 12, 8]} maxBarSize={36}>
                  {growthSeries.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.id === "before" ? "url(#growthBefore)" : "url(#growthAfter)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
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
          ) : topPages.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
              Sin datos disponibles en el informe panoramico.
            </p>
          ) : (
            <div className="mt-3 rounded-2xl bg-muted/30 p-3 ring-1 ring-black/5">
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
                      contentStyle={{ borderRadius: 12, borderColor: "#d0d4dc", background: "#ffffff" }}
                      formatter={(value, _name, props) => {
                        const record = props.payload as PanoramaPageChart | undefined;
                        return [
                          `${formatNumber(Number(value))} vistas | ${formatRatioPercent(record?.rebote ?? 0)} rebote`,
                          record?.titulo ?? "",
                        ];
                      }}
                    />
                    <Bar dataKey="vistas" fill="url(#pageViewsFill)" radius={[6, 10, 10, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        <div />
      </div>

      <div className="mt-6">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.28em]"
              style={{ color: "var(--text-1)" }}
            >
              Ciudades destacadas
            </p>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              Usuarios activos por ciudad
            </p>
          </div>
          {topCities.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {topCities.map((city) => (
                <div
                  key={city.ciudad}
                  className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2 text-xs font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  <span className="truncate text-[11px]" style={{ color: "var(--text-2)" }}>
                    {city.ciudad}
                  </span>
                  <span className="text-sm">{formatNumber(city.usuarios)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs" style={{ color: "var(--text-2)" }}>
              Sin ciudades disponibles en el informe panoramico.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6">
        <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
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
