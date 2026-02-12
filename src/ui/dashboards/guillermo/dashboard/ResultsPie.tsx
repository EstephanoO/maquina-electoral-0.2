"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/ui/primitives/button";
import { CAMPAIGNS_RESULTS_CSV_PATH } from "@/dashboards/guillermo/constants/dashboard";
import {
  formatCurrencyPen,
  formatNumber,
  formatPercent,
} from "@/dashboards/guillermo/utils/dashboardFormat";

type Mode = "gasto" | "interacciones";

type IndicatorDatum = {
  label: string;
  value: number;
  color: string;
};

const COLORS = [
  "#38bdf8",
  "#22c55e",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#e11d48",
];

const INDICATOR_LABELS: Record<string, string> = {
  "actions:like": "Me gusta",
  "actions:post_engagement": "Interaccion",
  "actions:onsite_conversion.messaging_conversation_started_7d": "Conversacion",
  "actions:offsite_conversion.fb_pixel_lead": "Conversion",
  "actions:omni_landing_page_view": "Trafico",
  "actions:link_click": "Clics",
  "actions:rsvp": "Confirmaciones",
  reach: "Alcance",
  "video_thruplay_watched_actions": "Reproducciones",
};

const normalizeIndicator = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return "Otros";
  return INDICATOR_LABELS[trimmed] ?? "Otros";
};

const parseNumber = (value: string | undefined) => {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (char === "," || char === "\n")) {
      row.push(current);
      current = "";
      if (char === "\n") {
        rows.push(row);
        row = [];
      }
      continue;
    }
    if (!inQuotes && char === "\r") {
      continue;
    }
    current += char;
  }
  row.push(current);
  rows.push(row);
  return rows.filter((line) => line.some((cell) => cell.trim().length));
};

const buildSeries = (rows: string[][]) => {
  if (rows.length < 2) return null;
  const headers = rows[0].map((cell) => cell.trim());
  const indicatorIndex = headers.indexOf("Indicador de resultado");
  const resultsIndex = headers.indexOf("Resultados");
  const spendIndex = headers.indexOf("Importe gastado (PEN)");
  if (indicatorIndex === -1 || resultsIndex === -1 || spendIndex === -1) return null;

  const aggregated = new Map<string, { results: number; spend: number }>();
  rows.slice(1).forEach((row) => {
    const indicatorRaw = row[indicatorIndex] ?? "";
    const indicator = normalizeIndicator(indicatorRaw);
    const results = parseNumber(row[resultsIndex]);
    const spend = parseNumber(row[spendIndex]);
    if (results === 0 && spend === 0) return;
    const current = aggregated.get(indicator) ?? { results: 0, spend: 0 };
    aggregated.set(indicator, {
      results: current.results + results,
      spend: current.spend + spend,
    });
  });

  return aggregated;
};

const toPieData = (
  aggregated: Map<string, { results: number; spend: number }>,
  mode: Mode,
) => {
  const entries = Array.from(aggregated.entries()).map(([label, values], index) => ({
    label,
    value: mode === "gasto" ? values.spend : values.results,
    color: COLORS[index % COLORS.length],
  }));
  return entries.filter((entry) => entry.value > 0);
};

export default function ResultsPie() {
  const [mode, setMode] = React.useState<Mode>("gasto");
  const [data, setData] = React.useState<Map<string, { results: number; spend: number }> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch(CAMPAIGNS_RESULTS_CSV_PATH, { cache: "no-store" });
        if (!response.ok) throw new Error("csv");
        const text = await response.text();
        if (!isMounted) return;
        const parsed = parseCsv(text);
        const aggregated = buildSeries(parsed);
        if (!aggregated) throw new Error("parse");
        setData(aggregated);
      } catch {
        if (isMounted) setError("No se pudo cargar el CSV de campanas.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const pieData = data ? toPieData(data, mode) : [];
  const totalResults = data
    ? Array.from(data.values()).reduce((sum, item) => sum + item.results, 0)
    : 0;
  const totalSpend = data
    ? Array.from(data.values()).reduce((sum, item) => sum + item.spend, 0)
    : 0;
  const total = mode === "gasto" ? totalSpend : totalResults;
  const sortedData = [...pieData].sort((a, b) => b.value - a.value);
  const visibleData = showAll ? sortedData : sortedData.slice(0, 5);

  return (
    <section className="group w-full rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-0 transition hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--text-1)" }}>
            Distribucion
          </p>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>
            Indicadores por resultado
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted/40 p-1">
          <Button
            size="sm"
            variant={mode === "gasto" ? "default" : "ghost"}
            className={mode === "gasto" ? "shadow-sm" : "text-muted-foreground"}
            onClick={() => setMode("gasto")}
          >
            Gasto
          </Button>
          <Button
            size="sm"
            variant={mode === "interacciones" ? "default" : "ghost"}
            className={mode === "interacciones" ? "shadow-sm" : "text-muted-foreground"}
            onClick={() => setMode("interacciones")}
          >
            Interacciones
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
            Inversion total
          </p>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
            {formatCurrencyPen(totalSpend)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
            Interacciones
          </p>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
            {formatNumber(totalResults)}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>
          {error}
        </p>
      ) : pieData.length === 0 ? (
        <p className="mt-4 text-xs" style={{ color: "var(--text-2)" }}>
          Sin datos para mostrar.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="h-56 rounded-2xl bg-muted/20 p-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Tooltip
                  wrapperStyle={{ zIndex: 40 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d0d4dc",
                    background: "#ffffff",
                    maxWidth: 220,
                    whiteSpace: "normal",
                  }}
                  formatter={(value) =>
                    mode === "gasto"
                      ? formatCurrencyPen(Number(value ?? 0))
                      : formatNumber(Number(value ?? 0))
                  }
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2">
            {visibleData.map((entry) => {
              const ratio = total > 0 ? entry.value / total : 0;
              return (
                <div
                  key={entry.label}
                  className="rounded-2xl bg-muted/20 px-3 py-2"
                >
                 <div className="flex items-center justify-between gap-2 min-w-0">
                   <div
                     className="flex min-w-0 flex-1 items-center gap-2 text-xs"
                     style={{ color: "var(--text-2)" }}
                   >
                     <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                     <span className="block truncate font-semibold uppercase tracking-[0.18em]">
                       {entry.label}
                     </span>
                   </div>
                   <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--text-1)" }}>
                     {mode === "gasto"
                       ? formatCurrencyPen(entry.value)
                       : formatNumber(entry.value)}
                   </span>
                 </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-200/70">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.max(3, Math.round(ratio * 100))}%`,
                          background: entry.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-2)" }}>
                      {formatPercent(ratio * 100)}
                    </span>
                  </div>
                </div>
              );
            })}
            {sortedData.length > 5 ? (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs uppercase tracking-[0.18em] text-muted-foreground"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? "Ver menos" : "Ver mas"}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
