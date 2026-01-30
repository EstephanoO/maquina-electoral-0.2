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
  campaignId?: string | null;
  clientKey?: string;
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
  campaignId = null,
  clientKey,
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
  const withLocation = points.length;
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
  const goalValueNumber = React.useMemo(() => {
    if (!dataGoalIndex) return null;
    const hasSelection = Boolean(
      mapSelection?.depCode ||
        mapSelection?.provCode ||
        mapSelection?.distCode ||
        mapSelection?.depName ||
        mapSelection?.provName ||
        mapSelection?.distName,
    );
    if (!hasSelection) return dataGoalIndex.total ?? null;
    return resolveGoalForSelection(mapSelection, dataGoalIndex);
  }, [dataGoalIndex, mapSelection]);

  const zoneProgress = React.useMemo(() => {
    if (!goalValueNumber || goalValueNumber <= 0) return 0;
    return (selectionTotal / goalValueNumber) * 100;
  }, [goalValueNumber, selectionTotal]);

  // Estado del mapa
  const mapStatus = isLoading
    ? "loading"
    : error
      ? "error"
      : filteredMapPoints.length > 0
        ? undefined
        : "empty";

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

        {/* Main grid: Map + Sidebar */}
        <div
          className={`grid gap-6 ${
            isCompact ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "lg:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          {/* Map Section */}
          <MapSection
            points={filteredMapPoints}
            candidateLabels={candidateLabels}
            mapStatus={mapStatus}
            mapRef={mapRef}
            resetMapView={resetMapView}
            setResetMapView={setResetMapView}
            withLocation={withLocation}
            showLegend={false}
            focusPoint={focusPoint}
            onClearFocusPoint={() => setFocusPoint(null)}
            campaignId={campaignId}
            onHierarchySelectionChange={setMapSelection}
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

            {/* Zone Coverage */}
            <Card className="border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Cobertura de zona
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Zona actual</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {goalScopeLabel ?? "Peru"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Puntos en zona</span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectionTotal.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Objetivo zona</span>
                    <span className="text-sm font-semibold text-foreground">
                      {goalValueNumber ? goalValueNumber.toLocaleString("en-US") : "-"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted/40">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-red-400 to-amber-400"
                      style={{ width: `${Math.min(zoneProgress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-right text-xs font-semibold text-foreground">
                    {goalValueNumber ? `${Math.min(zoneProgress, 100).toFixed(2)}%` : "-"}
                  </div>
                </div>
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
