"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useEventData } from "./hooks/useEventData";
import { useEventActions } from "./hooks/useEventActions";
import { useCandidateVisibility } from "./hooks/useCandidateVisibility";
import { useInterviewerTracking } from "./hooks/useInterviewerTracking";
import { useAppStateCurrent } from "./hooks/useAppStateCurrent";
import {
  convertRowsToPoints,
  calculateCandidateCounts,
  calculateInterviewerCounts,
  calculateInterviewerRanking,
  generateInterviewerTimelineData,
  getLastUpdated,
} from "./utils/dataUtils";
import { DashboardHeader, TotalStats } from "./components/HeaderComponents";
import { MapSection } from "./components/MapSection";
import datosGiovanna from "@/db/constants/datos-giovanna.json";
import type { MapHierarchySelection } from "@/modules/maps/PeruMapPanel";

type EventMapDashboardProps = {
  eventTitle: string;
  eventSubtitle?: string;
  candidateLabels: string[];
  dataUrl?: string;
  eventId?: string | null;
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

type DataGoalRecord = {
  departamento: string;
  provincia: string;
  distrito: string;
  electores: number;
  datos_a_recopilar: number;
  porcentaje: number;
};

type DataGoalIndex = {
  total: number | null;
  byDep: Map<string, number>;
  byProv: Map<string, number>;
  byDist: Map<string, number>;
};

const normalizeName = (value?: string | null) => value?.trim().toUpperCase() ?? "";

const buildDataGoalIndex = (
  records: DataGoalRecord[],
  total: number | null,
): DataGoalIndex => {
  const byDep = new Map<string, number>();
  const byProv = new Map<string, number>();
  const byDist = new Map<string, number>();

  for (const record of records) {
    const dep = normalizeName(record.departamento);
    const prov = normalizeName(record.provincia);
    const dist = normalizeName(record.distrito);
    const value = Number(record.datos_a_recopilar) || 0;
    if (dep) byDep.set(dep, (byDep.get(dep) ?? 0) + value);
    if (dep && prov) {
      const key = `${dep}::${prov}`;
      byProv.set(key, (byProv.get(key) ?? 0) + value);
    }
    if (dep && prov && dist) {
      const key = `${dep}::${prov}::${dist}`;
      byDist.set(key, (byDist.get(key) ?? 0) + value);
    }
  }

  return { total, byDep, byProv, byDist };
};

const resolveGoalForSelection = (
  selection: MapHierarchySelection | null,
  index: DataGoalIndex,
) => {
  if (!selection) return index.total;
  const depName = normalizeName(selection.depName);
  const provName = normalizeName(selection.provName);
  const distName = normalizeName(selection.distName);

  if (selection.level === "distrito") {
    if (depName && provName && distName) {
      return index.byDist.get(`${depName}::${provName}::${distName}`) ?? 0;
    }
    if (depName && provName) {
      return index.byProv.get(`${depName}::${provName}`) ?? 0;
    }
    if (depName) return index.byDep.get(depName) ?? 0;
    return 0;
  }

  if (selection.level === "provincia") {
    if (depName && provName) {
      return index.byProv.get(`${depName}::${provName}`) ?? 0;
    }
    if (depName) return index.byDep.get(depName) ?? 0;
    return 0;
  }

  if (depName) return index.byDep.get(depName) ?? 0;
  return 0;
};

export const EventMapDashboard = ({
  eventTitle,
  eventSubtitle = "Actualizacion en tiempo real",
  candidateLabels,
  dataUrl = "/api/interviews",
  eventId = null,
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
  const [showMovingOnly, setShowMovingOnly] = React.useState(false);
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

  const {
    points: trackingRows,
    isLoading: trackingLoading,
    error: trackingError,
  } = useInterviewerTracking({ dataUrl: trackingUrl });

  const telemetrySignatures = React.useMemo(() => {
    const signatures = new Set<string>();
    for (const row of trackingRows) {
      if (row.signature) signatures.add(row.signature);
    }
    return Array.from(signatures);
  }, [trackingRows]);

  const telemetryUrl = React.useMemo(() => {
    if (telemetrySignatures.length === 0) return null;
    const params = new URLSearchParams();
    for (const signature of telemetrySignatures) {
      params.append("signature", signature);
    }
    return `/api/v1/telemetry/app-state?${params.toString()}`;
  }, [telemetrySignatures]);

  const { items: telemetryItems } = useAppStateCurrent({ dataUrl: telemetryUrl });
  const telemetryBySignature = React.useMemo(() => {
    const map = new Map<string, (typeof telemetryItems)[number]>();
    for (const item of telemetryItems) {
      if (!item.signature) continue;
      map.set(item.signature.trim().toLowerCase(), item);
    }
    return map;
  }, [telemetryItems]);

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
  const interviewerColors = ["#6366f1", "#22d3ee", "#f97316"];
  const lastUpdated = React.useMemo(() => getLastUpdated(rows), [rows]);
  const filteredMapPoints = React.useMemo(
    () => filteredPoints(points),
    [points, filteredPoints],
  );

  const trackingPoints = React.useMemo(() => {
    const now = Date.now();
    const presenceThresholdMs = 15 * 1000;
    const candidateSet = new Set(
      candidateLabels.map((label) => label.trim().toLowerCase()).filter(Boolean),
    );
    return trackingRows
      .filter((row) => {
        if (candidateSet.size === 0) return true;
        const candidateValue = row.candidate?.trim().toLowerCase();
        return candidateValue ? candidateSet.has(candidateValue) : false;
      })
      .map((row) => {
        const signatureKey = row.signature?.trim().toLowerCase() ?? "";
        const telemetry = signatureKey ? telemetryBySignature.get(signatureKey) : undefined;
        const lastSeenActiveAt = telemetry?.lastSeenActiveAt
          ? new Date(telemetry.lastSeenActiveAt).getTime()
          : null;
        const trackedAt = new Date(row.trackedAt).getTime();
        const trackedRecent = Number.isFinite(trackedAt)
          ? now - trackedAt <= presenceThresholdMs
          : false;
        const isActive = lastSeenActiveAt
          ? now - lastSeenActiveAt <= presenceThresholdMs
          : trackedRecent;
        const distanceMeters = row.distanceMeters;
        const hasDistance = typeof distanceMeters === "number" && Number.isFinite(distanceMeters);
        const isMoving = hasDistance
          ? distanceMeters > 10
          : row.mode?.toLowerCase() === "moving";
        return {
          online: isActive,
          lat: row.latitude,
          lng: row.longitude,
          interviewer: row.interviewer,
          candidate: row.candidate,
          createdAt: row.trackedAt,
          kind: "tracking" as const,
          mode: row.mode,
          signature: row.signature,
          accuracy: row.accuracy,
          altitude: row.altitude,
          speed: row.speed,
          heading: row.heading,
          isMoving,
        };
      });
  }, [candidateLabels, telemetryBySignature, trackingRows]);

  const movingTrackingPoints = React.useMemo(
    () => trackingPoints.filter((point) => point.isMoving ?? point.mode?.toLowerCase() === "moving"),
    [trackingPoints],
  );

  const presenceThresholdMs = 15 * 1000;
  const interviewerStatus = React.useMemo(() => {
    const now = Date.now();
    return trackingRows
      .map((row) => {
        const signatureKey = row.signature?.trim().toLowerCase() ?? "";
        const telemetry = signatureKey ? telemetryBySignature.get(signatureKey) : undefined;
        const lastSeenActiveAt = telemetry?.lastSeenActiveAt
          ? new Date(telemetry.lastSeenActiveAt).getTime()
          : null;
        const trackedAt = new Date(row.trackedAt).getTime();
        const trackedRecent = Number.isFinite(trackedAt)
          ? now - trackedAt <= presenceThresholdMs
          : false;
        const isActive = lastSeenActiveAt
          ? now - lastSeenActiveAt <= presenceThresholdMs
          : trackedRecent;
        const isConnected =
          telemetry?.lastIsInternetReachable === true ||
          telemetry?.lastIsConnected === true;
        const distanceMeters = row.distanceMeters;
        const hasDistance = typeof distanceMeters === "number" && Number.isFinite(distanceMeters);
        const isMoving = hasDistance
          ? distanceMeters > 10
          : row.mode?.toLowerCase() === "moving";
        const status = !isActive
          ? "inactive"
          : !isMoving
            ? "stationary"
            : isConnected
              ? "connected"
              : "inactive";
        return {
          key: row.interviewerKey,
          interviewer: row.interviewer,
          mode: row.mode,
          trackedAt: row.trackedAt,
          isMoving,
          isActive,
          isConnected,
          status,
        };
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        if (a.isMoving !== b.isMoving) return a.isMoving ? -1 : 1;
        return a.interviewer.localeCompare(b.interviewer);
      });
  }, [trackingRows, telemetryBySignature]);

  const displayMapPoints = React.useMemo(
    () => (showMovingOnly ? movingTrackingPoints : [...filteredMapPoints, ...trackingPoints]),
    [filteredMapPoints, movingTrackingPoints, showMovingOnly, trackingPoints],
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

  // Estado del mapa
  const baseMapStatus = isLoading
    ? "loading"
    : error
      ? "error"
      : filteredMapPoints.length > 0
        ? undefined
        : "empty";
  const trackingMapStatus = trackingLoading
    ? "loading"
    : trackingError
      ? "error"
      : movingTrackingPoints.length > 0
        ? undefined
        : "empty";
  const mapStatus = showMovingOnly ? trackingMapStatus : baseMapStatus;

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
      "Entrevistador",
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
        className={`mx-auto flex h-full w-full flex-col px-5 py-5 ${
          isCompact ? "max-w-[1280px] gap-4" : "max-w-[1400px] gap-5"
        }`}
      >
        {/* Header */}
        <DashboardHeader
          eventTitle={eventTitle}
          eventSubtitle={eventSubtitle}
          lastUpdated={lastUpdated}
          rows={rows}
          candidateLabels={candidateLabels}
          total={total}
          goalCurrent={selectionTotal}
          goalScopeLabel={goalScopeLabel}
          dataGoal={resolvedDataGoal}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFocusPoint={handleFocusPoint}
          onDownloadCSV={downloadCSV}
          candidateProfile={candidateProfile}
        />

        {contextNote ? (
          <Card className="border-border/60 bg-card/70 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {contextNote.title}
              </p>
              <p className="text-sm text-foreground">{contextNote.description}</p>
              {contextNote.details && contextNote.details.length > 0 ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {contextNote.details.map((detail) => (
                    <p key={detail}>- {detail}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* Main grid: Map + Sidebar */}
        <div
          className={`grid gap-6 ${
            isCompact ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "lg:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          {/* Map Section */}
          <MapSection
            points={displayMapPoints}
            hierarchyPoints={filteredMapPoints}
            candidateLabels={candidateLabels}
            mapStatus={mapStatus}
            mapRef={mapRef}
            resetMapView={resetMapView}
            setResetMapView={setResetMapView}
            withLocation={displayMapPoints.length}
            showLegend={false}
            focusPoint={focusPoint}
            onClearFocusPoint={() => setFocusPoint(null)}
            campaignId={campaignId}
            onHierarchySelectionChange={setMapSelection}
            showMovingOnly={showMovingOnly}
            onToggleMovingOnly={() => setShowMovingOnly((value) => !value)}
            trackingCount={trackingPoints.length}
            movingTrackingCount={movingTrackingPoints.length}
          />

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Top/Low Interviewers */}
            <Card className="border-border/60 bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Desempeno entrevistadores
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Top</p>
                    <p className="text-sm font-semibold text-foreground">
                      {topInterviewer ? topInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">
                    {topInterviewer ? topInterviewer[1] : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-sm font-semibold text-foreground">
                      {lowInterviewer ? lowInterviewer[0] : "-"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-amber-500">
                    {lowInterviewer ? lowInterviewer[1] : 0}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Top encuestadores</span>
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
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500"
                            style={{ width: `${Math.min(width, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Interviewer Status */}
            <Card className="border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Entrevistadores
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Conectado
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
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
                              ? "bg-emerald-500"
                              : item.status === "stationary"
                                ? "bg-orange-500"
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
          </aside>
        </div>

        {/* Bottom Charts */}
        <Card className="border-border/60 bg-card/70 p-4">
          <div className={`grid gap-6 ${isCompact ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
            {/* Interviewer Progress Chart (moved here) */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por entrevistador
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
                      stroke="rgba(148,163,184,0.6)"
                      strokeDasharray="4 4"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "12px",
                        color: "#e2e8f0",
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
            </div>

            {isCompact ? null : null}
          </div>
        </Card>
      </div>
    </div>
  );
};
