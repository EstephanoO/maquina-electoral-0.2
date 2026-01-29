"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEventData } from "./hooks/useEventData";
import { useEventActions } from "./hooks/useEventActions";
import { useCandidateVisibility } from "./hooks/useCandidateVisibility";
import {
  convertRowsToPoints,
  calculateCandidateCounts,
  calculateInterviewerCounts,
  calculateInterviewerRanking,
  generateCandidateTimelineData,
  generateInterviewerTimelineData,
  generateCandidateBarData,
  getLastUpdated,
  getCandidateColor,
} from "./utils/dataUtils";
import { DashboardHeader, TotalStats } from "./components/HeaderComponents";
import { CandidateDistribution } from "./components/CandidateDistribution";
import { MapSection } from "./components/MapSection";
import type { EventRecord } from "./EventRecordsDialog";

type EventMapDashboardProps = {
  eventTitle: string;
  eventSubtitle?: string;
  candidateLabels: string[];
  dataUrl?: string;
  candidateProfile?: {
    name: string;
    party: string;
    role: string;
    number: string;
    image: string;
  };
  dataGoal?: string;
  layoutVariant?: "default" | "compact";
};

export const EventMapDashboard = ({
  eventTitle,
  eventSubtitle = "Actualizacion en tiempo real",
  candidateLabels,
  dataUrl = "/api/interviews",
  candidateProfile,
  dataGoal,
  layoutVariant = "default",
}: EventMapDashboardProps) => {
  const isCompact = layoutVariant === "compact";
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

  const { handleEdit, handleDelete, createFocusPointHandler } = useEventActions(
    {
      dataUrl,
      mutate,
    },
  );

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

  // Timeline data
  const timelineData = React.useMemo(
    () => generateCandidateTimelineData(rows, candidateLabels),
    [rows, candidateLabels],
  );

  const interviewerTimelineData = React.useMemo(
    () => generateInterviewerTimelineData(rows, topInterviewerForChart),
    [rows, topInterviewerForChart],
  );

  const candidateBarData = React.useMemo(
    () => generateCandidateBarData(candidateLabels, counts),
    [candidateLabels, counts],
  );

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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFocusPoint={handleFocusPoint}
          onDownloadCSV={downloadCSV}
          candidateProfile={candidateProfile}
        />

        {/* Candidate Distribution */}
        <CandidateDistribution
          candidateLabels={candidateLabels}
          counts={counts}
          total={total}
          rows={rows}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFocusPoint={handleFocusPoint}
          hiddenCandidates={hiddenCandidates}
          onToggleCandidateVisibility={toggleCandidateVisibility}
          dataGoal={dataGoal}
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
            </Card>

            {/* Candidate Progress Dialog (replaced interviewer) */}
            <Card className="border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {isCompact ? "Progreso" : "Progreso por candidato"}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      Ver mas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-background text-foreground">
                    <DialogHeader>
                      <DialogTitle>Ranking general de candidatos</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border/60">
                      <div className="divide-y divide-border/60">
                        {candidateLabels.map((candidate) => {
                          const count = counts[candidate] ?? 0;
                          const percent =
                            total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div
                              key={candidate}
                              className="flex items-center justify-between px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {candidate}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {percent}% del total
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-foreground">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {/* Candidate Timeline Chart */}
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {candidateLabels.map((candidate, index) => {
                    const legendColors = ["bg-emerald-500", "bg-blue-500", "bg-orange-500"];
                    const dotColor = legendColors[index] ?? "bg-slate-400";
                    return (
                      <span key={candidate} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        {candidate}
                      </span>
                    );
                  })}
                </div>
                <div className="h-[160px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
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
                      {candidateLabels.map((candidate) => (
                        <Line
                          key={candidate}
                          type="monotone"
                          dataKey={candidate}
                          stroke={getCandidateColor(candidate, candidateLabels)}
                          strokeWidth={2.2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
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

            {/* Candidate Bar Chart (moved here) */}
            {isCompact ? null : (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Comparativo candidatos
                  </p>
                  <span className="text-xs text-muted-foreground">Barras</span>
                </div>
                <div className="mt-4 h-[220px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={candidateBarData}
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                      barCategoryGap={12}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.92)",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: "12px",
                          color: "#e2e8f0",
                        }}
                        labelStyle={{ color: "#f8fafc" }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={18}>
                        {candidateBarData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={getCandidateColor(entry.name, candidateLabels)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
