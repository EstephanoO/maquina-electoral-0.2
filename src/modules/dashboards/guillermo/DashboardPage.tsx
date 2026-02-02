"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import ThemeToggleButton from "./dashboard/ThemeToggleButton";
import {
  DASHBOARD_THEME,
  GROWTH_CUTOFF_DATE,
  SENTIMENT_DATA,
  SUMMARY_FORMAT,
  TOTAL_INTERACTIONS_DISPLAY,
} from "./constants/dashboard";
import { useDailySeries } from "./hooks/useDailySeries";
import { useDashboardTheme } from "./hooks/useDashboardTheme";
import { useLandingsPayments } from "./hooks/useLandingsPayments";
import { usePanoramaData } from "./hooks/usePanoramaData";
import type {
  DailyPoint,
  GrowthSeriesItem,
  PanoramaPageChart,
  SentimentStackDatum,
  SummaryCard,
} from "./types/dashboard";
import { truncateText } from "./utils/dashboardFormat";
import { calculateAverageReach, calculateTrendSeries } from "./utils/dashboardMath";

const DashboardMain = dynamic(() => import("./dashboard/DashboardMain"), {
  ssr: false,
  loading: () => (
    <div className="px-6 py-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      Cargando dashboard...
    </div>
  ),
});

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get("preview") === "1";
  const { theme, toggleTheme } = useDashboardTheme();
  const [panoramaFile, setPanoramaFile] = React.useState<File | null>(null);
  const [facebookFile, setFacebookFile] = React.useState<File | null>(null);
  const [landingsFile, setLandingsFile] = React.useState<File | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const photoUrl = React.useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );
  React.useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);
  const { dailySeries } = useDailySeries({ file: facebookFile });
  const { landingsPayments, landingsError, landingsLoading } = useLandingsPayments();
  const { panoramaData, panoramaError, panoramaLoading } = usePanoramaData({
    file: panoramaFile,
    cacheMode: isPreview ? "no-store" : "force-cache",
  });
  const trendStroke = theme === DASHBOARD_THEME.DARK ? "#f8fafc" : "#0f172a";

  const reachPeak = dailySeries.reduce<DailyPoint | null>((current, item) => {
    if (!current || item.reach > current.reach) return item;
    return current;
  }, null);
  const trendSeries = calculateTrendSeries(dailySeries);
  const beforeSeries = dailySeries.filter((item) => item.dateKey < GROWTH_CUTOFF_DATE);
  const afterSeries = dailySeries.filter((item) => item.dateKey >= GROWTH_CUTOFF_DATE);
  const beforeAverage = calculateAverageReach(beforeSeries);
  const afterAverage = calculateAverageReach(afterSeries);
  const totalAverage = beforeAverage + afterAverage;
  const growthSeries: GrowthSeriesItem[] = [
    {
      id: "before",
      label: "Antes 24 Nov",
      value: totalAverage > 0 ? (beforeAverage / totalAverage) * 100 : 0,
      averageReach: beforeAverage,
    },
    {
      id: "after",
      label: "Despues 24 Nov",
      value: totalAverage > 0 ? (afterAverage / totalAverage) * 100 : 0,
      averageReach: afterAverage,
    },
  ];

  const summaryCards: SummaryCard[] = panoramaData.summary
    ? [
        {
          label: "Usuarios activos",
          value: panoramaData.summary.usuariosActivos,
          format: SUMMARY_FORMAT.NUMBER,
        },
        {
          label: "Usuarios nuevos",
          value: panoramaData.summary.usuariosNuevos,
          format: SUMMARY_FORMAT.NUMBER,
        },
        {
          label: "Tiempo medio de interaccion",
          value: panoramaData.summary.tiempoInteraccion,
          format: SUMMARY_FORMAT.SECONDS,
        },
        {
          label: "Eventos",
          value: panoramaData.summary.eventos,
          format: SUMMARY_FORMAT.NUMBER,
        },
      ]
    : [];
  const topPages: PanoramaPageChart[] = panoramaData.pages
    .slice()
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 6)
    .map((page) => ({
      ...page,
      tituloCorto: truncateText(page.titulo, 42),
    }));
  const sentimentStack: SentimentStackDatum[] = [
    {
      name: "Sentimiento",
      positivo: SENTIMENT_DATA[0].value,
      neutral: SENTIMENT_DATA[1].value,
      negativo: SENTIMENT_DATA[2].value,
      mixto: SENTIMENT_DATA[3].value,
    },
  ];
  const hasDailyData = dailySeries.length > 0;
  const hasPanoramaData = Boolean(panoramaData.summary) || topPages.length > 0;
  const panoramaDailyActive = panoramaData.dailyActive;

  return (
    <main
      className="relative min-h-screen bg-transparent text-[color:var(--text-1)]"
      style={
        {
          "--bg": "var(--background)",
          "--text-1": "var(--foreground)",
          "--text-2": "var(--muted-foreground)",
          "--card": "var(--card)",
          "--surface": "var(--muted)",
          "--surface-strong": "rgba(148,163,184,0.18)",
          "--border": "var(--border)",
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="order-1 flex-1">
          <DashboardHeader imageSrc={photoUrl ?? undefined} />
          <DashboardMain
            trendSeries={trendSeries}
            reachPeak={reachPeak}
            trendStroke={trendStroke}
            theme={theme}
            totalInteractionsDisplay={TOTAL_INTERACTIONS_DISPLAY}
            growthSeries={growthSeries}
            panoramaLoading={panoramaLoading}
            panoramaError={panoramaError}
            topPages={topPages}
            panoramaDailyActive={panoramaDailyActive}
            sentimentData={[...SENTIMENT_DATA]}
            sentimentStack={sentimentStack}
            hasDailyData={hasDailyData}
            hasPanoramaData={hasPanoramaData}
            landingsPayments={landingsPayments}
            landingsLoading={landingsLoading}
            landingsError={landingsError}
          />
        </div>
        <DashboardSidebar summaryCards={summaryCards} />
      </div>
      <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
      {isPreview ? (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-transparent bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Preview admin
              </p>
              <p className="text-sm font-semibold text-foreground">
                Vista candidata sin header de admin
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setPreviewDialogOpen(true)}>
                Configurar archivos
              </Button>
              <Button asChild>
                <Link href="/console/campaigns/cand-guillermo">Salir</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar preview</DialogTitle>
            <DialogDescription>
              Subi archivos para actualizar la vista en tiempo real.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-transparent bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground">Informe panoramico (CSV)</p>
              <p className="text-xs text-muted-foreground">Reemplaza los datos GA4 del panel.</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(event) => setPanoramaFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                Subir CSV
              </label>
              {panoramaFile ? (
                <p className="mt-2 text-xs text-foreground">Archivo: {panoramaFile.name}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Sin archivo cargado.</p>
              )}
            </div>
            <div className="rounded-2xl border border-transparent bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground">Dataset Facebook (JSON)</p>
              <p className="text-xs text-muted-foreground">Actualiza la evolucion diaria del alcance.</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                <input
                  type="file"
                  accept=".json"
                  onChange={(event) => setFacebookFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                Subir JSON
              </label>
              {facebookFile ? (
                <p className="mt-2 text-xs text-foreground">Archivo: {facebookFile.name}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Sin archivo cargado.</p>
              )}
            </div>
            <div className="rounded-2xl border border-transparent bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground">Foto del candidato</p>
              <p className="text-xs text-muted-foreground">Actualiza la imagen del header.</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                Subir foto
              </label>
              {photoFile ? (
                <p className="mt-2 text-xs text-foreground">Archivo: {photoFile.name}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Sin archivo cargado.</p>
              )}
            </div>
            <div className="rounded-2xl border border-transparent bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground">Landings / Campanas (XLSX o CSV)</p>
              <p className="text-xs text-muted-foreground">
                Referencia: `/public/guillermo/Landings.xlsx`.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(event) => setLandingsFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                Subir XLSX/CSV
              </label>
              {landingsFile ? (
                <p className="mt-2 text-xs text-foreground">Archivo: {landingsFile.name}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Sin archivo cargado.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPanoramaFile(null);
                setFacebookFile(null);
                setLandingsFile(null);
                setPhotoFile(null);
              }}
            >
              Restablecer
            </Button>
            <Button onClick={() => setPreviewDialogOpen(false)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
