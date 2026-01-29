"use client";

import * as React from "react";
import useSWR from "swr";

import { Card } from "@/components/ui/card";

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
  perHour: HourPoint[];
};

const formatNumber = new Intl.NumberFormat("es-PE");
const formatDateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});
const formatTime = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

export const TierraKpiRow = ({ client }: { client?: string }) => {
  const params = React.useMemo(() => {
    const query = new URLSearchParams();
    if (client) query.set("client", client);
    return query.toString();
  }, [client]);

  const key = params ? `/api/territory-summary?${params}` : "/api/territory-summary";

  const fetcher = React.useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("summary-failed");
    return response.json() as Promise<TerritorySummary>;
  }, []);

  const { data: summary, error, isLoading } = useSWR<TerritorySummary>(key, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });

  const hasError = Boolean(error);
  const total = summary?.total ?? 0;
  const activeInterviewers = summary?.uniqueInterviewers ?? 0;
  const perHour = summary?.perHour ?? [];
  const averagePerHour = perHour.length > 0 ? Math.round(total / perHour.length) : 0;

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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border/60 bg-card/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-foreground">
              {kpi.value}
            </span>
            <span className="text-xs font-semibold text-primary">
              {isLoading ? "Cargando" : hasError ? "Error" : "Live"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
        </Card>
      ))}
    </div>
  );
};
