"use client";

import * as React from "react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TerritorySummary = {
  total: number;
  uniqueInterviewers: number;
  latestAt: string | null;
  perCandidate: Array<{ name: string; count: number }>;
};

const formatNumber = new Intl.NumberFormat("es-PE");

export const TierraSidebar = ({
  className,
  client,
}: {
  className?: string;
  client?: string;
}) => {
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
  const isEmpty = !isLoading && !hasError && (summary?.total ?? 0) === 0;

  return (
    <aside className={cn("space-y-3 p-3", className)}>
      <Card className="rounded-md border-border/70 bg-card/80 p-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Resumen tierra
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-2xl font-semibold text-foreground">
            {formatNumber.format(summary?.total ?? 0)}
          </span>
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-300">Live</Badge>
            {isLoading ? (
              <Badge className="bg-muted text-muted-foreground">Cargando</Badge>
            ) : null}
            {hasError ? (
              <Badge className="bg-destructive/15 text-destructive">Error</Badge>
            ) : null}
            {isEmpty ? (
              <Badge className="bg-muted text-muted-foreground">Sin datos</Badge>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatNumber.format(summary?.uniqueInterviewers ?? 0)} entrevistadores activos
        </p>
      </Card>

      <Card className="rounded-md border-border/70 bg-card/80 p-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Por candidato
        </p>
        <div className="mt-3 space-y-2">
          {(summary?.perCandidate ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos disponibles.</p>
          ) : (
            summary?.perCandidate.map((candidate: { name: string; count: number }) => (
              <div key={candidate.name} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{candidate.name}</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatNumber.format(candidate.count)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </aside>
  );
};
