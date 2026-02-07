"use client";

import * as React from "react";
import { Card } from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useEventData } from "@/dashboards/events/hooks/useEventData";
import { useEventActions } from "@/dashboards/events/hooks/useEventActions";
import { useCandidateVisibility } from "@/dashboards/events/hooks/useCandidateVisibility";
import { useInterviewerTracking } from "@/dashboards/events/hooks/useInterviewerTracking";
import { useTrackingStatus } from "@/dashboards/events/hooks/useTrackingStatus";
import { useRealtimeTrackingStream } from "@/dashboards/events/hooks/useRealtimeTrackingStream";
import {
  convertRowsToPoints,
  calculateCandidateCounts,
  calculateInterviewerCounts,
  calculateInterviewerRanking,
  generateInterviewerTimelineData,
  getLastUpdated,
} from "@/dashboards/events/utils/dataUtils";
import {
  buildDataGoalIndex,
  resolveGoalForSelection,
} from "@/dashboards/events/utils/dataGoal";
import type { DataGoalRecord } from "@/dashboards/events/utils/dataGoal";
import { MapSection } from "./components/MapSection";
import datosGiovanna from "@/db/constants/datos-giovanna.json";
import type { MapHierarchySelection } from "@/maps/hierarchy/types";

type EventMapDashboardProps = {
  eventTitle: string;
  eventSubtitle?: string;
  candidateLabels: string[];
  dataUrl?: string;
  campaignId?: string | null;
  clientKey?: string;
  contextNote?: {
    title: string;
    description: string;
    details?: string[];
  };
  candidateProfile?: {
    name: string;
    party: string;
    role: string;
    number: string;
    image: string;
  };
  dataGoal?: string;
  layoutVariant?: "default" | "compact";
  hideMapLegend?: boolean;
};


export const EventMapDashboard = ({
  eventTitle,
  eventSubtitle = "Actualizacion en tiempo real",
  candidateLabels,
  dataUrl = "/api/interviews",
  campaignId = null,
  clientKey,
  contextNote,
  candidateProfile,
  dataGoal,
  layoutVariant = "default",
  hideMapLegend = false,
}: EventMapDashboardProps) => {
  const isCompact = layoutVariant === "compact";
  const [mapSelection, setMapSelection] = React.useState<MapHierarchySelection | null>(null);
  const [focusPoint, setFocusPoint] = React.useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [mapViewMode, setMapViewMode] = React.useState<"tracking" | "interview">(
    "tracking",
  );
  // Hooks para manejo de datos y estado
  const {
    data,
    error,
    isLoading,
    mutate,
    rows,
    mapRef,
    resetMapView,
    setResetMapView,
  } = useEventData({ dataUrl });

  const { handleEdit, handleDelete, createFocusPointHandler } = useEventActions({
    dataUrl,
    mutate,
    onFocusRecord: (record) => {
      if (record.latitude === null || record.longitude === null) return;
      setFocusPoint({ lat: record.latitude, lng: record.longitude });
    },
  });

  const { hiddenCandidates, toggleCandidateVisibility, filteredPoints } =
    useCandidateVisibility();

  const trackingUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (clientKey) params.set("client", clientKey);
    params.set("includePrevious", "1");
    const query = params.toString();
    return query ? `/api/interviewer-tracking?${query}` : "/api/interviewer-tracking";
  }, [clientKey]);

  const realtimeStreamUrl =
    typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WS_EVENTS_URL ?? null : null;

  const {
    points: trackingRows,
    isLoading: trackingLoading,
    error: trackingError,
  } = useInterviewerTracking({
    dataUrl: trackingUrl,
    refreshInterval: realtimeStreamUrl ? 0 : 5000,
  });

  const { trackingRows: realtimeTrackingRows, telemetryOverrides } = useRealtimeTrackingStream({
    streamUrl: realtimeStreamUrl,
    initialTrackingRows: trackingRows,
  });

  // Cálculos de datos
  const points = React.useMemo(() => convertRowsToPoints(rows), [rows]);
  const counts = React.useMemo(() => calculateCandidateCounts(rows), [rows]);
  const interviewerCounts = React.useMemo(
    () => calculateInterviewerCounts(rows),
    [rows],
  );
  const interviewerRanking = React.useMemo(
    () => calculateInterviewerRanking(interviewerCounts),
    [interviewerCounts],
  );
  const total = React.useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + value, 0),
    [counts],
  );
  const topInterviewer = interviewerRanking[0];
  const lowInterviewer = interviewerRanking[interviewerRanking.length - 1];
  const topInterviewers = interviewerRanking.slice(0, 5);
  const topInterviewerForChart = interviewerRanking
    .slice(0, 3)
    .map(([name]) => name);
  const interviewerColors = ["#163960", "#2b4f86", "#ffc800"];
  const lastUpdated = React.useMemo(() => getLastUpdated(rows), [rows]);
  const interviewPoints = React.useMemo(
    () => points.filter((point) => point.kind === "interview"),
    [points],
  );
  const filteredMapPoints = React.useMemo(
    () => filteredPoints(points),
    [points, filteredPoints],
  );
  const filteredInterviewPoints = React.useMemo(
    () => filteredPoints(interviewPoints),
    [filteredPoints, interviewPoints],
  );

  const presenceThresholdMs = 15 * 1000;
  const movementThresholdMeters = 10;
  const { trackingPoints, interviewerStatus } = useTrackingStatus({
    trackingRows: realtimeTrackingRows,
    candidateLabels,
    presenceThresholdMs,
    movementThresholdMeters,
    telemetryOverrides,
  });

  const displayMapPoints = React.useMemo(() => {
    if (mapViewMode === "tracking") return trackingPoints;
    return filteredInterviewPoints;
  }, [filteredInterviewPoints, mapViewMode, trackingPoints]);
  const mapPointCount = React.useMemo(
    () => filteredInterviewPoints.length,
    [filteredInterviewPoints],
  );

  const dataGoalIndex = React.useMemo(() => {
    if (clientKey !== "giovanna") return null;
    const total = typeof datosGiovanna?.resumen?.total_datos_a_recopilar === "number"
      ? datosGiovanna.resumen.total_datos_a_recopilar
      : null;
    return buildDataGoalIndex(datosGiovanna.registros as DataGoalRecord[], total);
  }, [clientKey]);

  const resolvedDataGoal = React.useMemo(() => {
    if (!dataGoalIndex) return dataGoal;
    const hasSelection = Boolean(
      mapSelection?.depCode ||
        mapSelection?.provCode ||
        mapSelection?.distCode ||
        mapSelection?.depName ||
        mapSelection?.provName ||
        mapSelection?.distName,
    );
    if (!hasSelection && dataGoalIndex.total) {
      return dataGoalIndex.total.toLocaleString("en-US");
    }
    const goalValue = resolveGoalForSelection(mapSelection, dataGoalIndex);
    if (hasSelection && (!goalValue || goalValue <= 0)) return "0";
    if (!goalValue || goalValue <= 0) return dataGoalIndex.total?.toLocaleString("en-US") ?? dataGoal;
    return goalValue.toLocaleString("en-US");
  }, [dataGoal, dataGoalIndex, mapSelection]);

  const selectionTotal = React.useMemo(() => {
    if (!mapSelection) return total;
    return typeof mapSelection.pointCount === "number" ? mapSelection.pointCount : total;
  }, [mapSelection, total]);

  const goalScopeLabel = React.useMemo(() => {
    if (!mapSelection) return null;
    const parts = [mapSelection.depName, mapSelection.provName, mapSelection.distName].filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }, [mapSelection]);

  const interviewerTimelineData = React.useMemo(
    () => generateInterviewerTimelineData(rows, topInterviewerForChart),
    [rows, topInterviewerForChart],
  );

  const totalLabel = total.toLocaleString("en-US");
  const selectionLabel = selectionTotal.toLocaleString("en-US");
  const goalNumeric = resolvedDataGoal
    ? Number(resolvedDataGoal.replace(/[^0-9]/g, ""))
    : null;
  const goalProgress = goalNumeric ? (selectionTotal / goalNumeric) * 100 : 0;
  const goalProgressLabel = goalNumeric ? `${Math.min(goalProgress, 100).toFixed(1)}%` : "-";
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  // Estado del mapa
  const baseMapStatus = isLoading
    ? "loading"
    : error
      ? "error"
      : displayMapPoints.length > 0
        ? undefined
        : "empty";
  const trackingHasData = realtimeTrackingRows.length > 0;
  const trackingMapStatus = trackingLoading && !trackingHasData
    ? "loading"
    : trackingError
      ? "error"
      : trackingPoints.length > 0
        ? undefined
        : "empty";
  const mapStatus = mapViewMode === "tracking" ? trackingMapStatus : baseMapStatus;

  // Manejo de foco en puntos del mapa
  const handleFocusPoint = React.useMemo(
    () => createFocusPointHandler(mapRef),
    [createFocusPointHandler, mapRef],
  );


  // Hora actual para referencia
  const nowHour = new Date().getHours();
  const nowLabel = `${nowHour.toString().padStart(2, "0")}:00`;

  // Download CSV function (mantener en el componente principal para el header)
  const downloadCSV = React.useCallback(() => {
    if (rows.length === 0) return;

    const headers = [
      "ID",
      "Agente de campo",
      "Candidato",
      "Nombre",
      "Teléfono",
      "Firma",
      "Este (UTM)",
      "Norte (UTM)",
      "Latitud",
      "Longitud",
      "Fecha",
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.id || "",
          row.interviewer || "",
          row.candidate || "",
          row.name || "",
          row.phone || "",
          row.signature || "",
          row.east || "",
          row.north || "",
          row.latitude || "",
          row.longitude || "",
          row.createdAt || "",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `registros_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rows]);

  return (
    <div className="min-h-screen w-screen bg-background text-foreground">
      <div
        className={`mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-4 lg:px-6 ${
          isCompact ? "max-w-[1280px]" : "max-w-[1680px]"
        }`}
      >
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <img
              src="/isotipo(2).jpg"
              alt="GOBERNA"
              className="h-10 w-10 rounded-full border border-border/60 bg-white"
            />
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.45em] text-primary">
                GOBERNA
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                Tierra · {eventTitle}
              </p>
              <p className="text-xs text-muted-foreground">{eventSubtitle}</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
              <Button
                size="sm"
                variant={mapViewMode === "tracking" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => setMapViewMode("tracking")}
              >
                Tracking
              </Button>
              <Button
                size="sm"
                variant={mapViewMode === "interview" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => setMapViewMode("interview")}
              >
                Entrevistas
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={downloadCSV} disabled={rows.length === 0}>
              Descargar CSV
            </Button>
            <div className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground">
              Actualizado {lastUpdatedLabel}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="space-y-4">
            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center gap-4">
                <img
                  src={candidateProfile?.image ?? "/2guillermo.jpg"}
                  alt={candidateProfile?.name ?? "Candidato"}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Candidatura
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {candidateProfile?.name ?? candidateLabels[0] ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {candidateProfile?.role ?? ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {candidateProfile?.party ?? ""} {candidateProfile?.number ? `· ${candidateProfile.number}` : ""}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-card/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Indicadores clave
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Registros actuales
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{selectionLabel}</p>
                  <p className="text-xs text-muted-foreground">Total general: {totalLabel}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Meta de datos</span>
                    <span>{goalScopeLabel ?? "Total"}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-lg font-semibold text-foreground">
                      {selectionLabel}/{resolvedDataGoal ?? "-"}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">{goalProgressLabel}</p>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted/40">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#163960] via-[#2b4f86] to-[#ffc800]"
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {contextNote ? (
              <Card className="border-border/60 bg-card/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {contextNote.title}
                </p>
                <p className="mt-2 text-sm text-foreground">{contextNote.description}</p>
                {contextNote.details && contextNote.details.length > 0 ? (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {contextNote.details.map((detail) => (
                      <p key={detail}>- {detail}</p>
                    ))}
                  </div>
                ) : null}
              </Card>
            ) : null}
          </aside>

          <div className="space-y-4">
            <MapSection
              points={displayMapPoints}
              hierarchyPoints={filteredInterviewPoints}
              candidateLabels={candidateLabels}
              mapStatus={mapStatus}
              mapRef={mapRef}
              resetMapView={resetMapView}
              setResetMapView={setResetMapView}
              withLocation={mapPointCount}
              showLegend
              focusPoint={focusPoint}
              onClearFocusPoint={() => setFocusPoint(null)}
              campaignId={campaignId}
              onHierarchySelectionChange={setMapSelection}
            />
          </div>

          <aside className="space-y-4">
            <Card className="border-border/60 bg-card/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Desempeno agentes de campo
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Top</p>
                    <p className="text-sm font-semibold text-foreground">
                      {topInterviewer ? topInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {topInterviewer ? topInterviewer[1] : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-secondary/40 bg-secondary/15 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-sm font-semibold text-foreground">
                      {lowInterviewer ? lowInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {lowInterviewer ? lowInterviewer[1] : 0}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Top agentes de campo</span>
                  <span>Hoy</span>
                </div>
                <div className="space-y-2">
                  {topInterviewers.map(([name, count]) => {
                    const maxValue = topInterviewers[0]?.[1] ?? 0;
                    const width = maxValue > 0 ? (count / maxValue) * 100 : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate text-foreground">{name}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/40">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-[#163960] via-[#2b4f86] to-[#ffc800]"
                            style={{ width: `${Math.min(width, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Agentes de campo
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Conectado
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Activo sin movimiento
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Inactivo
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {interviewerStatus.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                    Sin tracking activo.
                  </div>
                ) : (
                  interviewerStatus.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.interviewer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.status === "connected"
                            ? "Conectado"
                            : item.status === "stationary"
                              ? "Activo sin movimiento"
                              : "Inactivo"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            item.status === "connected"
                              ? "bg-primary"
                              : item.status === "stationary"
                                ? "bg-secondary"
                                : "bg-slate-400"
                          }`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {item.trackedAt
                            ? new Date(item.trackedAt).toLocaleTimeString("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por agente de campo
                </p>
                <span className="text-xs text-muted-foreground">
                  Actividad por hora (Hoy)
                </span>
              </div>
              <div className="mt-4 h-[220px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart
                    data={interviewerTimelineData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <ReferenceLine
                      x={nowLabel}
                      stroke="rgba(22,57,96,0.5)"
                      strokeDasharray="4 4"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(12,22,40,0.95)",
                        border: "1px solid rgba(22,57,96,0.35)",
                        borderRadius: "12px",
                        color: "#f8fafc",
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    {topInterviewerForChart.map((interviewer, index) => (
                      <Line
                        key={interviewer}
                        type="monotone"
                        dataKey={interviewer}
                        stroke={interviewerColors[index] ?? "#94a3b8"}
                        strokeWidth={2.2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
