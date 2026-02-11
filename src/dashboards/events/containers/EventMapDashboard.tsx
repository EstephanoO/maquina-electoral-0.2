"use client";

import * as React from "react";
import { useEventData } from "@/dashboards/events/hooks/useEventData";
import { useCandidateVisibility } from "@/dashboards/events/hooks/useCandidateVisibility";
import { useInterviewerTracking } from "@/dashboards/events/hooks/useInterviewerTracking";
import { useTrackingStatus } from "@/dashboards/events/hooks/useTrackingStatus";
import { useRealtimeTrackingStream } from "@/dashboards/events/hooks/useRealtimeTrackingStream";
import { useInterviewDistricts } from "@/dashboards/events/hooks/useInterviewDistricts";
import { useInterviewDepartmentSummary } from "@/dashboards/events/hooks/useInterviewDepartmentSummary";
import { useInterviewSelectionCount } from "@/dashboards/events/hooks/useInterviewSelectionCount";
import {
  convertRowsToPoints,
  calculateCandidateCounts,
  calculateInterviewerCounts,
  calculateInterviewerRanking,
  generateInterviewerTimelineData,
  getLastUpdated,
} from "@/dashboards/events/utils/dataUtils";
import type { MapHierarchySelection } from "@/maps/hierarchy/types";
import objectiveSp from "@/objetive-sp.json";
import votosRocio from "@/lib/votos_rocio.json";
import datosGiovanna from "@/db/constants/datos-giovanna.json";
import { EventMapDashboardView } from "@/ui/dashboards/events/EventMapDashboardView";

type RocioRecord = {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  datos_a_recopilar?: number;
};

type GiovannaRecord = {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  datos_a_recopilar?: number;
};

type EventMapDashboardProps = {
  eventTitle: string;
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
  hideMapLegend?: boolean;
};

export const EventMapDashboard = ({
  eventTitle,
  candidateLabels,
  dataUrl = "/api/interviews",
  campaignId = null,
  clientKey,
  contextNote,
  candidateProfile,
  dataGoal,
  hideMapLegend = false,
}: EventMapDashboardProps) => {
  const isRocio = clientKey === "rocio";
  const isGiovanna = clientKey === "giovanna";
  const dataGoalOverride = isRocio ? 80000 : null;
  const [mapSelection, setMapSelection] = React.useState<MapHierarchySelection | null>(null);
  const [mapViewMode, setMapViewMode] = React.useState<"tracking" | "interview">(
    "tracking",
  );
  const [focusPoint, setFocusPoint] = React.useState<{ lat: number; lng: number } | null>(null);
  const [highlightPoint, setHighlightPoint] = React.useState<{ lat: number; lng: number } | null>(null);
  const [timelineScope, setTimelineScope] = React.useState<"day" | "week">("day");

  const {
    error,
    isLoading,
    rows,
    mapRef,
    resetMapView,
    setResetMapView,
  } = useEventData({ dataUrl });

  const { filteredPoints } = useCandidateVisibility();

  const { districts: interviewDistricts } = useInterviewDistricts({
    clientKey,
    refreshInterval: 15000,
  });

  const {
    total: interviewTotal,
    departments: interviewDepartments,
  } = useInterviewDepartmentSummary({
    clientKey,
    refreshInterval: 15000,
  });

  const { count: interviewSelectionCount } = useInterviewSelectionCount({
    clientKey,
    selection: mapSelection,
    refreshInterval: 15000,
  });

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
  const topInterviewers = interviewerRanking.slice(0, 5);
  const topInterviewerForChart = interviewerRanking.slice(0, 3).map(([name]) => name);
  const interviewerColors = ["#163960", "#2b4f86", "#ffc800"];
  const lastUpdated = React.useMemo(() => getLastUpdated(rows), [rows]);
  const interviewPoints = React.useMemo(
    () => points.filter((point) => point.kind === "interview"),
    [points],
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

  const enrichedInterviewerStatus = React.useMemo(() => {
    const pointByInterviewer = new Map(
      trackingPoints
        .filter((point) => point.interviewer)
        .map((point) => [point.interviewer as string, point]),
    );
    return interviewerStatus.map((item) => {
      const point = pointByInterviewer.get(item.interviewer);
      return {
        ...item,
        lat: point?.lat,
        lng: point?.lng,
      };
    });
  }, [interviewerStatus, trackingPoints]);

  const displayMapPoints = React.useMemo(() => {
    if (mapViewMode === "tracking") return trackingPoints;
    return filteredInterviewPoints;
  }, [filteredInterviewPoints, mapViewMode, trackingPoints]);
  const mapPointCount = filteredInterviewPoints.length;

  const normalizeDepartmentName = React.useCallback((value?: string | null) => {
    if (!value) return "";
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }, []);

  const normalizeDepartmentCode = React.useCallback((value?: string | null) => {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    return digits.padStart(2, "0");
  }, []);

  const rocioMetaGoal = React.useMemo(() => {
    if (!isRocio) return null;
    const records = (votosRocio as { registros?: RocioRecord[] }).registros ?? [];
    if (records.length === 0) return dataGoalOverride ?? null;
    const totalRecords = records.reduce(
      (acc, item) => acc + (Number(item.datos_a_recopilar) || 0),
      0,
    );
    const depKey = normalizeDepartmentName(mapSelection?.depName);
    const provKey = normalizeDepartmentName(mapSelection?.provName);
    const distKey = normalizeDepartmentName(mapSelection?.distName);
    let sum = 0;

    for (const item of records) {
      const dep = normalizeDepartmentName(item.departamento);
      const prov = normalizeDepartmentName(item.provincia);
      const dist = normalizeDepartmentName(item.distrito);
      if (distKey) {
        if (depKey && dep !== depKey) continue;
        if (provKey && prov !== provKey) continue;
        if (dist !== distKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
        continue;
      }
      if (provKey) {
        if (depKey && dep !== depKey) continue;
        if (prov !== provKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
        continue;
      }
      if (depKey) {
        if (dep !== depKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
      }
    }

    if (distKey || provKey || depKey) return sum;
    return dataGoalOverride ?? totalRecords;
  }, [
    dataGoalOverride,
    isRocio,
    mapSelection?.depName,
    mapSelection?.distName,
    mapSelection?.provName,
    normalizeDepartmentName,
  ]);

  const giovannaMetaGoal = React.useMemo(() => {
    if (!isGiovanna) return null;
    const payload = datosGiovanna as {
      registros?: GiovannaRecord[];
      resumen?: { total_datos_a_recopilar?: number };
    };
    const records = payload.registros ?? [];
    const summaryTotal = Number(payload.resumen?.total_datos_a_recopilar) || 0;
    if (records.length === 0) return summaryTotal || null;
    const totalRecords = records.reduce(
      (acc, item) => acc + (Number(item.datos_a_recopilar) || 0),
      0,
    );
    const depKey = normalizeDepartmentName(mapSelection?.depName);
    const provKey = normalizeDepartmentName(mapSelection?.provName);
    const distKey = normalizeDepartmentName(mapSelection?.distName);
    let sum = 0;

    for (const item of records) {
      const dep = normalizeDepartmentName(item.departamento);
      const prov = normalizeDepartmentName(item.provincia);
      const dist = normalizeDepartmentName(item.distrito);
      if (distKey) {
        if (depKey && dep !== depKey) continue;
        if (provKey && prov !== provKey) continue;
        if (dist !== distKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
        continue;
      }
      if (provKey) {
        if (depKey && dep !== depKey) continue;
        if (prov !== provKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
        continue;
      }
      if (depKey) {
        if (dep !== depKey) continue;
        sum += Number(item.datos_a_recopilar) || 0;
      }
    }

    if (distKey || provKey || depKey) return sum;
    return summaryTotal || totalRecords;
  }, [
    isGiovanna,
    mapSelection?.depName,
    mapSelection?.distName,
    mapSelection?.provName,
    normalizeDepartmentName,
  ]);

  const objectiveByDepartment = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of objectiveSp.departamentos ?? []) {
      const key = normalizeDepartmentName(item.departamento);
      if (!key) continue;
      map.set(key, Number(item.meta_datos_minima) || 0);
    }
    return map;
  }, [normalizeDepartmentName]);

  const objectiveByDepartmentCode = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of objectiveSp.departamentos ?? []) {
      const key = String(item.id ?? "").padStart(2, "0");
      if (!key) continue;
      map.set(key, Number(item.meta_datos_minima) || 0);
    }
    return map;
  }, []);

  const totalObjectiveGoal = React.useMemo(() => {
    if (dataGoalOverride) return dataGoalOverride;
    return (objectiveSp.departamentos ?? []).reduce(
      (acc, item) => acc + (Number(item.meta_datos_minima) || 0),
      0,
    );
  }, [dataGoalOverride]);

  const interviewCountsByDepartment = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of interviewDepartments) {
      const key = normalizeDepartmentName(item.name);
      if (!key) continue;
      map.set(key, item.count ?? 0);
    }
    return map;
  }, [interviewDepartments, normalizeDepartmentName]);

  const interviewCountsByDepartmentCode = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of interviewDepartments) {
      if (!item.code) continue;
      const key = normalizeDepartmentCode(item.code);
      if (!key) continue;
      map.set(key, item.count ?? 0);
    }
    return map;
  }, [interviewDepartments, normalizeDepartmentCode]);

  const interviewDepartmentNameByCode = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of interviewDepartments) {
      if (!item.code || !item.name) continue;
      const key = normalizeDepartmentCode(item.code);
      if (!key) continue;
      map.set(key, item.name);
    }
    return map;
  }, [interviewDepartments, normalizeDepartmentCode]);

  const selectedDepartmentKey = React.useMemo(() => {
    return normalizeDepartmentName(mapSelection?.depName);
  }, [mapSelection?.depName, normalizeDepartmentName]);

  const selectedDepartmentCode = React.useMemo(() => {
    return normalizeDepartmentCode(mapSelection?.depCode ?? null);
  }, [mapSelection?.depCode, normalizeDepartmentCode]);

  const resolvedDataGoal = React.useMemo(() => {
    if (isRocio) {
      if (typeof rocioMetaGoal === "number") return rocioMetaGoal;
      return dataGoalOverride ?? (Number(dataGoal) || 0);
    }
    if (isGiovanna) {
      if (typeof giovannaMetaGoal === "number") return giovannaMetaGoal;
      return Number(dataGoal) || 0;
    }
    if (dataGoalOverride) return dataGoalOverride;
    if (selectedDepartmentCode) {
      const byCode = objectiveByDepartmentCode.get(selectedDepartmentCode);
      if (typeof byCode === "number") return byCode;
    }
    if (selectedDepartmentKey) {
      return objectiveByDepartment.get(selectedDepartmentKey) ?? 0;
    }
    if (selectedDepartmentCode) {
      const fallbackName = interviewDepartmentNameByCode.get(selectedDepartmentCode);
      const fallbackKey = normalizeDepartmentName(fallbackName);
      if (fallbackKey) return objectiveByDepartment.get(fallbackKey) ?? 0;
    }
    return totalObjectiveGoal || (Number(dataGoal) || 0);
  }, [
    dataGoal,
    dataGoalOverride,
    giovannaMetaGoal,
    isGiovanna,
    isRocio,
    rocioMetaGoal,
    interviewDepartmentNameByCode,
    normalizeDepartmentName,
    objectiveByDepartment,
    objectiveByDepartmentCode,
    selectedDepartmentCode,
    selectedDepartmentKey,
    totalObjectiveGoal,
  ]);

  const selectionTotal = React.useMemo(() => {
    if (mapSelection) {
      return typeof interviewSelectionCount === "number" ? interviewSelectionCount : 0;
    }
    if (selectedDepartmentCode) {
      return interviewCountsByDepartmentCode.get(selectedDepartmentCode) ?? 0;
    }
    if (selectedDepartmentKey) {
      return interviewCountsByDepartment.get(selectedDepartmentKey) ?? 0;
    }
    return total || interviewTotal;
  }, [
    interviewSelectionCount,
    interviewCountsByDepartment,
    interviewCountsByDepartmentCode,
    interviewTotal,
    mapSelection,
    selectedDepartmentCode,
    selectedDepartmentKey,
    total,
  ]);

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
  const votesGoal = 20000;
  const selectionLabel = selectionTotal.toLocaleString("en-US");
  const goalNumeric = typeof resolvedDataGoal === "number" ? resolvedDataGoal : Number(resolvedDataGoal) || 0;
  const goalProgress = goalNumeric > 0 ? (selectionTotal / goalNumeric) * 100 : 0;
  const goalProgressLabel = goalNumeric
    ? `${Math.min(goalProgress, 100).toFixed(2)}%`
    : "-";
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

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
  const interviewDistrictCodes = React.useMemo(
    () => (mapViewMode === "interview" ? interviewDistricts : []),
    [interviewDistricts, mapViewMode],
  );

  const nowHour = new Date().getHours();
  const nowLabel = `${nowHour.toString().padStart(2, "0")}:00`;

  const updatesFull = React.useMemo(() => {
    return [...rows]
      .filter((row) => row.latitude !== null && row.longitude !== null)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 50)
      .map((row) => ({
        id: row.id ?? `${row.latitude}-${row.longitude}-${row.createdAt ?? ""}`,
        interviewer: row.interviewer ?? "Alguien",
        candidate: row.candidate ?? "",
        createdAt: row.createdAt ?? "",
        lat: row.latitude as number,
        lng: row.longitude as number,
      }));
  }, [rows]);
  const updates = React.useMemo(() => updatesFull.slice(0, 5), [updatesFull]);

  const handleUpdateFocus = React.useCallback((item: (typeof updates)[number]) => {
    setFocusPoint({ lat: item.lat, lng: item.lng });
    setHighlightPoint({ lat: item.lat, lng: item.lng });
    setMapViewMode("interview");
    mapRef.current?.flyTo({
      center: [item.lng, item.lat],
      zoom: 16,
      duration: 1200,
    });
    window.setTimeout(() => {
      setHighlightPoint(null);
    }, 1800);
  }, [mapRef]);

  const handleAgentFocus = React.useCallback(
    (item: { interviewer: string; lat: number; lng: number }) => {
      setFocusPoint({ lat: item.lat, lng: item.lng });
      setHighlightPoint({ lat: item.lat, lng: item.lng });
      setMapViewMode("tracking");
      mapRef.current?.flyTo({
        center: [item.lng, item.lat],
        zoom: 16,
        duration: 1200,
      });
      window.setTimeout(() => {
        setHighlightPoint(null);
      }, 1800);
    },
    [mapRef],
  );

  const candidateFilters = React.useMemo(
    () => [
      {
        id: "default",
        label: candidateLabels[0] ?? eventTitle,
        image: candidateProfile?.image,
      },
    ],
    [candidateLabels, candidateProfile?.image, eventTitle],
  );

  const handleHierarchySelectionChange = React.useCallback(
    (selection: MapHierarchySelection) => {
      if (!selection.depCode && !selection.provCode && !selection.distCode) {
        setMapSelection(null);
        return;
      }
      setMapSelection(selection);
    },
    [],
  );

  return (
    <EventMapDashboardView
      eventTitle={eventTitle}
      candidateLabels={candidateLabels}
      campaignId={campaignId}
      contextNote={contextNote}
      candidateProfile={candidateProfile}
      selectionLabel={selectionLabel}
      totalLabel={totalLabel}
      metaDataCountLabel={selectionLabel}
      metaDataGoalLabel={goalNumeric ? goalNumeric.toLocaleString("en-US") : "-"}
      metaDataProgressLabel={goalProgressLabel}
      metaDataProgress={goalProgress}
      metaVotesCountLabel="0"
      metaVotesGoalLabel={votesGoal.toLocaleString("en-US")}
      metaVotesProgressLabel="0.00%"
      metaVotesProgress={0}
      showMetaVotes={!isRocio}
      goalScopeLabel={goalScopeLabel}
      lastUpdatedLabel={lastUpdatedLabel}
      mapViewMode={mapViewMode}
      onMapViewModeChange={setMapViewMode}
      tableRows={rows}
      tableFilterCandidate={candidateLabels[0] ?? null}
      mapStatus={mapStatus}
      mapRef={mapRef}
      resetMapView={resetMapView}
      setResetMapView={setResetMapView}
      mapPointCount={mapPointCount}
      displayMapPoints={displayMapPoints}
      filteredInterviewPoints={filteredInterviewPoints}
      interviewDistrictCodes={interviewDistrictCodes}
      onHierarchySelectionChange={handleHierarchySelectionChange}
      focusPoint={focusPoint}
      onClearFocusPoint={() => setFocusPoint(null)}
      highlightPoint={highlightPoint}
      interviewerStatus={enrichedInterviewerStatus}
      onAgentFocus={handleAgentFocus}
      topInterviewers={topInterviewers}
      interviewerTimelineData={interviewerTimelineData}
      nowLabel={nowLabel}
      topInterviewerForChart={topInterviewerForChart}
      interviewerColors={interviewerColors}
      hideMapLegend={isRocio || isGiovanna || hideMapLegend}
      updates={updates}
      updatesFull={updatesFull}
      onUpdateFocus={handleUpdateFocus}
      candidateFilters={candidateFilters}
      activeCandidateId="default"
      timelineScope={timelineScope}
      onTimelineScopeChange={setTimelineScope}
    />
  );
};
