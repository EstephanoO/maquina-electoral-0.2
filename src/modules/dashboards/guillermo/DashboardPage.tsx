"use client";

import type { CSSProperties } from "react";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardMain from "./dashboard/DashboardMain";
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
import { useGuillermoMapData } from "./hooks/useGuillermoMapData";
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

export default function DashboardPage() {
  const { theme, toggleTheme } = useDashboardTheme();
  const { dailySeries } = useDailySeries();
  const { panoramaData, panoramaError, panoramaLoading } = usePanoramaData();
  const { mapData, mapError } = useGuillermoMapData();
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
    },
    {
      id: "after",
      label: "Despues 24 Nov",
      value: totalAverage > 0 ? (afterAverage / totalAverage) * 100 : 0,
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
  const topCities = panoramaData.cities
    .filter((city) => {
      const normalized = city.ciudad.trim().toLowerCase();
      return normalized !== "all users" && !/^\d+$/.test(normalized);
    })
    .slice()
    .sort((a, b) => b.usuarios - a.usuarios)
    .slice(0, 6);
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
  const hasCitiesData = topCities.length > 0;

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
          <DashboardHeader />
          <DashboardMain
            mapData={mapData}
            mapError={mapError}
            trendSeries={trendSeries}
            reachPeak={reachPeak}
            trendStroke={trendStroke}
            theme={theme}
            totalInteractionsDisplay={TOTAL_INTERACTIONS_DISPLAY}
            growthSeries={growthSeries}
            panoramaLoading={panoramaLoading}
            panoramaError={panoramaError}
            topPages={topPages}
            topCities={topCities}
            sentimentData={[...SENTIMENT_DATA]}
            sentimentStack={sentimentStack}
            hasDailyData={hasDailyData}
            hasPanoramaData={hasPanoramaData}
            hasCitiesData={hasCitiesData}
          />
        </div>
        <DashboardSidebar summaryCards={summaryCards} />
      </div>
      <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
    </main>
  );
}
