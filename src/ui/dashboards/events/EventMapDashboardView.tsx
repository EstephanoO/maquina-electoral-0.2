"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card } from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/primitives/dialog";
import { ChevronDown } from "lucide-react";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { MapHierarchySelection } from "@/maps/hierarchy/types";
import type { MapPoint } from "@/dashboards/events/utils/dataUtils";
import type { EventRecord } from "@/ui/dashboards/events/EventRecordsDialog";
import { EventRecordsDialog } from "@/ui/dashboards/events/EventRecordsDialog";
import type { InterviewerTimelineChartProps } from "./components/InterviewerTimelineChart";
import { MapSection } from "./components/MapSection";

const InterviewerTimelineChart = dynamic<InterviewerTimelineChartProps>(
  () =>
    import("./components/InterviewerTimelineChart").then(
      (mod) => mod.InterviewerTimelineChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full rounded-2xl border border-border/60 bg-muted/20" />
    ),
  },
);

type InterviewerStatusItem = {
  key: string;
  interviewer: string;
  status: "connected" | "stationary" | "inactive";
  trackedAt: string;
  lat?: number;
  lng?: number;
};

type CandidateFilterOption = {
  id: string;
  label: string;
  image?: string;
};

type UpdateLogItem = {
  id: string;
  interviewer: string;
  candidate: string;
  createdAt: string;
  lat: number;
  lng: number;
};

const EMPTY_TABLE_ROWS: EventRecord[] = [];
const EMPTY_UPDATES: UpdateLogItem[] = [];

type EventMapDashboardViewProps = {
  eventTitle: string;
  candidateLabels: string[];
  campaignId?: string | null;
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
  selectionLabel: string;
  totalLabel: string;
  metaDataCountLabel: string;
  metaDataGoalLabel: string;
  metaDataProgressLabel: string;
  metaDataProgress: number;
  metaVotesCountLabel: string;
  metaVotesGoalLabel: string;
  metaVotesProgressLabel: string;
  metaVotesProgress: number;
  goalScopeLabel?: string | null;
  lastUpdatedLabel: string;
  mapViewMode: "tracking" | "interview";
  onMapViewModeChange: (mode: "tracking" | "interview") => void;
  tableRows?: EventRecord[];
  tableFilterCandidate?: string | null;
  candidateFilters?: CandidateFilterOption[];
  activeCandidateId?: string;
  onCandidateChange?: (candidateId: string) => void;
  updates?: UpdateLogItem[];
  updatesFull?: UpdateLogItem[];
  onUpdateFocus?: (item: UpdateLogItem) => void;
  focusPoint?: { lat: number; lng: number } | null;
  onClearFocusPoint?: () => void;
  highlightPoint?: { lat: number; lng: number } | null;
  mapStatus: "loading" | "error" | "empty" | undefined;
  mapRef: React.MutableRefObject<MapRef | null>;
  resetMapView: (() => void) | null;
  setResetMapView: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  mapPointCount: number;
  displayMapPoints: MapPoint[];
  filteredInterviewPoints: MapPoint[];
  interviewDistrictCodes?: string[];
  onHierarchySelectionChange: (selection: MapHierarchySelection) => void;
  interviewerStatus: InterviewerStatusItem[];
  onAgentFocus?: (target: { interviewer: string; lat: number; lng: number }) => void;
  topInterviewers: Array<[string, number]>;
  interviewerTimelineData: Array<Record<string, string | number>>;
  nowLabel: string;
  topInterviewerForChart: string[];
  interviewerColors: string[];
  hideMapLegend?: boolean;
  timelineScope?: "day" | "week";
  onTimelineScopeChange?: (scope: "day" | "week") => void;
};

export const EventMapDashboardView = ({
  eventTitle,
  candidateLabels,
  campaignId,
  contextNote,
  candidateProfile,
  selectionLabel,
  totalLabel,
  metaDataCountLabel,
  metaDataGoalLabel,
  metaDataProgressLabel,
  metaDataProgress,
  metaVotesCountLabel,
  metaVotesGoalLabel,
  metaVotesProgressLabel,
  metaVotesProgress,
  goalScopeLabel,
  lastUpdatedLabel,
  mapViewMode,
  onMapViewModeChange,
  tableRows = EMPTY_TABLE_ROWS,
  tableFilterCandidate = null,
  candidateFilters,
  activeCandidateId,
  onCandidateChange,
  updates,
  updatesFull = EMPTY_UPDATES,
  onUpdateFocus,
  focusPoint,
  onClearFocusPoint,
  highlightPoint,
  mapStatus,
  mapRef,
  resetMapView,
  setResetMapView,
  mapPointCount,
  displayMapPoints,
  filteredInterviewPoints,
  interviewDistrictCodes,
  onHierarchySelectionChange,
  interviewerStatus,
  onAgentFocus,
  topInterviewers,
  interviewerTimelineData,
  nowLabel,
  topInterviewerForChart,
  interviewerColors,
  hideMapLegend = false,
  timelineScope = "day",
  onTimelineScopeChange,
}: EventMapDashboardViewProps) => {
  const showCandidatePicker = Boolean(candidateFilters && candidateFilters.length > 1);
  const identityBlock = (
    <div className="flex items-center gap-4 rounded-2xl border border-transparent bg-transparent px-2 py-1 transition hover:bg-muted/20">
      <img
        src={candidateProfile?.image ?? "/2guillermo.jpg"}
        alt={candidateProfile?.name ?? "Candidato"}
        className="h-14 w-14 rounded-2xl bg-white object-contain p-1"
      />
      <div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Candidatura
        </p>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
          {candidateProfile?.name ?? candidateLabels[0] ?? eventTitle}
        </p>
        <p className="text-xs text-muted-foreground">{candidateProfile?.role ?? ""}</p>
        <p className="text-xs text-muted-foreground">
          {candidateProfile?.party ?? ""} {candidateProfile?.number ? `· ${candidateProfile.number}` : ""}
        </p>
      </div>
      {showCandidatePicker ? (
        <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
      ) : null}
    </div>
  );
  return (
    <div className="min-h-screen w-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-4 lg:px-6">
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            {showCandidatePicker ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="text-left">
                    {identityBlock}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[280px]">
                  {candidateFilters?.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onSelect={() => onCandidateChange?.(option.id)}
                    >
                      <div className="flex items-center gap-3">
                        {option.image ? (
                          <img
                            src={option.image}
                            alt={option.label}
                            className="h-7 w-7 rounded-full bg-white object-contain p-0.5"
                          />
                        ) : null}
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              identityBlock
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Meta de datos
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-[0.2em]">Total</span>
                  <span className="text-foreground">
                    {metaDataCountLabel}/{metaDataGoalLabel}
                  </span>
                  <span>{metaDataProgressLabel}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#163960] via-[#2b4f86] to-[#ffc800]"
                    style={{ width: `${Math.min(metaDataProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Meta de votos
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-[0.2em]">Total</span>
                  <span className="text-foreground">
                    {metaVotesCountLabel}/{metaVotesGoalLabel}
                  </span>
                  <span>{metaVotesProgressLabel}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#163960] via-[#2b4f86] to-[#ffc800]"
                    style={{ width: `${Math.min(metaVotesProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
              <Button
                size="sm"
                variant={mapViewMode === "tracking" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => onMapViewModeChange("tracking")}
              >
                Tracking
              </Button>
              <Button
                size="sm"
                variant={mapViewMode === "interview" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => onMapViewModeChange("interview")}
              >
                Datos
              </Button>
            </div>
            <EventRecordsDialog
              rows={tableRows}
              title="Registros"
              triggerLabel="Ver datos"
              filterCandidate={tableFilterCandidate}
            />
          </div>
        </section>

        <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 1fr) 360px" }}>
          <div className="space-y-4">
            <MapSection
              points={displayMapPoints}
              hierarchyPoints={filteredInterviewPoints}
              interviewDistrictCodes={interviewDistrictCodes}
              viewMode={mapViewMode}
              candidateLabels={candidateLabels}
              mapStatus={mapStatus}
              mapRef={mapRef}
              resetMapView={resetMapView}
              setResetMapView={setResetMapView}
              withLocation={mapPointCount}
              className="h-[calc(100vh-360px)] min-h-[620px]"
              style={{ height: "calc(100vh - 360px)", minHeight: 620 }}
              showLegend={!hideMapLegend}
              focusPoint={focusPoint}
              onClearFocusPoint={onClearFocusPoint}
              highlightPoint={highlightPoint}
              campaignId={campaignId}
              onHierarchySelectionChange={onHierarchySelectionChange}
            />

            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Progreso por agente de campo
                </p>
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
                  <Button
                    size="sm"
                    variant={timelineScope === "day" ? "default" : "ghost"}
                    className="h-7 rounded-full px-3 text-[11px]"
                    onClick={() => onTimelineScopeChange?.("day")}
                  >
                    Dia
                  </Button>
                  <Button
                    size="sm"
                    variant={timelineScope === "week" ? "default" : "ghost"}
                    className="h-7 rounded-full px-3 text-[11px]"
                    onClick={() => onTimelineScopeChange?.("week")}
                  >
                    Semana
                  </Button>
                </div>
              </div>
              <InterviewerTimelineChart
                data={interviewerTimelineData}
                nowLabel={nowLabel}
                series={topInterviewerForChart}
                colors={interviewerColors}
              />
            </Card>
          </div>

          <aside className="space-y-4">

            <Card className="border-border/60 bg-card/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top agentes de campo
              </p>
              <div className="mt-3 space-y-2">
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
              <div className="mt-3">
                {interviewerStatus.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                    Sin tracking activo.
                  </div>
                ) : (
                  <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                    {interviewerStatus.map((item) => (
                      <button
                        key={item.key}
                        className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/15 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/40 hover:ring-1 hover:ring-primary/30 hover:shadow-sm cursor-pointer"
                        onClick={() => {
                          if (item.lat !== undefined && item.lng !== undefined) {
                            onAgentFocus?.({
                              interviewer: item.interviewer,
                              lat: item.lat,
                              lng: item.lng,
                            });
                          }
                        }}
                        type="button"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {item.interviewer}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-border/60 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Log operativo
                </p>
                {updatesFull.length > 5 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                        Ver mas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Log operativo</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {updatesFull.map((item) => {
                          const candidateIndex = candidateLabels.findIndex(
                            (label) => label.toLowerCase() === item.candidate.toLowerCase(),
                          );
                          const badgeColor =
                            candidateIndex === 1
                              ? "bg-blue-500"
                              : candidateIndex === 2
                                ? "bg-orange-500"
                                : "bg-emerald-500";
                          return (
                            <button
                              key={item.id}
                              className="flex w-full items-start gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-left text-xs text-foreground transition hover:border-border/80 hover:bg-muted/30 cursor-pointer"
                              onClick={() => onUpdateFocus?.(item)}
                              type="button"
                            >
                              <span className={`mt-1 h-2 w-2 rounded-full ${badgeColor}`} />
                              <span>
                                <span className="font-semibold">{item.interviewer}</span> envio un
                                registro para {item.candidate}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {updates && updates.length > 0 ? (
                  updates.map((item) => {
                    const candidateIndex = candidateLabels.findIndex(
                      (label) => label.toLowerCase() === item.candidate.toLowerCase(),
                    );
                    const badgeColor =
                      candidateIndex === 1
                        ? "bg-blue-500"
                        : candidateIndex === 2
                          ? "bg-orange-500"
                          : "bg-emerald-500";
                    return (
                      <button
                        key={item.id}
                        className="flex w-full items-start gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-left text-xs text-foreground transition hover:border-primary/40 hover:bg-muted/40 hover:ring-1 hover:ring-primary/30 hover:shadow-sm cursor-pointer"
                        onClick={() => onUpdateFocus?.(item)}
                        type="button"
                      >
                        <span className={`mt-1 h-2 w-2 rounded-full ${badgeColor}`} />
                        <span>
                          <span className="font-semibold">{item.interviewer}</span> envio un
                          registro para {item.candidate}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">Sin notas operativas.</p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
