"use client";

import * as React from "react";
import { useCampaignsStore } from "@/campaigns/store";
import { useEventData } from "@/dashboards/events/hooks/useEventData";
import { useInterviewerTracking } from "@/dashboards/events/hooks/useInterviewerTracking";
import { useTrackingStatus } from "@/dashboards/events/hooks/useTrackingStatus";
import { useRealtimeTrackingStream } from "@/dashboards/events/hooks/useRealtimeTrackingStream";
import { useInterviewDepartmentSummary } from "@/dashboards/events/hooks/useInterviewDepartmentSummary";
import {
  convertRowsToPoints,
  calculateCandidateCounts,
  calculateInterviewerCounts,
  calculateInterviewerRanking,
  generateInterviewerTimelineData,
  getLastUpdated,
} from "@/dashboards/events/utils/dataUtils";
import type { MapPoint } from "@/dashboards/events/utils/dataUtils";
import { normalizeCandidateValue } from "@/dashboards/events/utils/partyUtils";
import type { GeoFeatureCollection, MapHierarchySelection } from "@/maps/hierarchy/types";
import { getGeoJson } from "@/maps/hierarchy/geoIndex";
import { isPointInGeometry } from "@/maps/hierarchy/geoSpatial";
import objectiveSp from "@/objetive-sp.json";
import { EventMapDashboardView } from "@/ui/dashboards/events/EventMapDashboardView";
import { useOperators } from "@/habilitaciones/hooks/useOperators";
import { useEnabledFormClientIds } from "@/habilitaciones/hooks/useEnabledFormClientIds";
import { enableFormAccess } from "@/habilitaciones/services/formsAccessApi";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Checkbox } from "@/ui/primitives/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/primitives/dialog";

const partyCampaignIds = ["cand-rocio", "cand-giovanna", "cand-guillermo"] as const;

type PartyMapDashboardProps = {
  mode?: "tierra" | "habilitaciones";
};

export const PartyMapDashboard = ({ mode = "tierra" }: PartyMapDashboardProps) => {
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const [mapSelection, setMapSelection] = React.useState<MapHierarchySelection | null>(null);
  const [mapViewMode, setMapViewMode] = React.useState<"tracking" | "interview">(
    mode === "habilitaciones" ? "interview" : "tracking",
  );
  const [activeCandidateId, setActiveCandidateId] = React.useState<string>("all");
  const [focusPoint, setFocusPoint] = React.useState<{ lat: number; lng: number } | null>(null);
  const [highlightPoint, setHighlightPoint] = React.useState<{ lat: number; lng: number } | null>(null);
  const [timelineScope, setTimelineScope] = React.useState<"day" | "week">("day");
  const [selectedOperatorIds, setSelectedOperatorIds] = React.useState<string[]>([]);
  const [selectedMapPoints, setSelectedMapPoints] = React.useState<MapPoint[]>([]);
  const [enableMessage, setEnableMessage] = React.useState<string | null>(null);
  const [savingAccess, setSavingAccess] = React.useState(false);
  const [habilitacionOpen, setHabilitacionOpen] = React.useState(false);
  const isHabilitaciones = mode === "habilitaciones";

  const {
    error,
    isLoading,
    rows,
    mapRef,
    resetMapView,
    setResetMapView,
  } = useEventData({ dataUrl: "/api/interviews" });

  const { operators } = useOperators();
  const {
    clientIds: enabledClientIds,
    isLoading: enabledLoading,
    error: enabledError,
    mutate: refreshEnabledClientIds,
  } = useEnabledFormClientIds({ enabled: isHabilitaciones });

  const { departments: interviewDepartments } = useInterviewDepartmentSummary({
    refreshInterval: 15000,
  });
  const [departmentGeojson, setDepartmentGeojson] = React.useState<GeoFeatureCollection | null>(null);

  const handleCandidateChange = React.useCallback(
    (candidateId: string) => {
      setActiveCandidateId(candidateId);
      setMapSelection(null);
      setFocusPoint(null);
      setHighlightPoint(null);
      setMapViewMode(isHabilitaciones ? "interview" : "tracking");
      resetMapView?.();
    },
    [isHabilitaciones, resetMapView],
  );

  const realtimeStreamUrl =
    typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WS_EVENTS_URL ?? null : null;

  const {
    points: trackingRows,
    isLoading: trackingLoading,
    error: trackingError,
  } = useInterviewerTracking({
    dataUrl: "/api/interviewer-tracking?includePrevious=1",
    refreshInterval: realtimeStreamUrl ? 0 : 5000,
  });

  const { trackingRows: realtimeTrackingRows, telemetryOverrides } = useRealtimeTrackingStream({
    streamUrl: realtimeStreamUrl,
    initialTrackingRows: trackingRows,
  });

  const candidates = React.useMemo(() => {
    return partyCampaignIds
      .map((id) => {
        const campaign = campaigns.find((item) => item.id === id);
        const profile = campaignProfiles[id];
        return {
          id,
          name: campaign?.name ?? id,
          profile,
        };
      })
      .filter(Boolean);
  }, [campaignProfiles, campaigns]);

  const activeCandidate = candidates.find((candidate) => candidate.id === activeCandidateId);
  const activeCandidateLabels =
    activeCandidateId === "all"
      ? candidates.map((candidate) => candidate.name)
      : activeCandidate
        ? [activeCandidate.name]
        : [];

  const candidateFilteredRows = React.useMemo(() => {
    if (activeCandidateId === "all") return rows;
    const target = normalizeCandidateValue(activeCandidate?.name ?? "");
    return rows.filter((row) => normalizeCandidateValue(row.candidate) === target);
  }, [activeCandidate?.name, activeCandidateId, rows]);

  const enabledClientIdSet = React.useMemo(
    () => new Set(enabledClientIds ?? []),
    [enabledClientIds],
  );
  const eligibilityReady = isHabilitaciones && !enabledLoading && !enabledError;

  const filteredRows = React.useMemo(() => {
    if (!isHabilitaciones) return candidateFilteredRows;
    if (!eligibilityReady) return candidateFilteredRows;
    return candidateFilteredRows.filter((row) => {
      if (!row.id) return false;
      return !enabledClientIdSet.has(row.id);
    });
  }, [candidateFilteredRows, eligibilityReady, enabledClientIdSet, isHabilitaciones]);

  const points = React.useMemo(() => convertRowsToPoints(filteredRows), [filteredRows]);
  const counts = React.useMemo(() => calculateCandidateCounts(filteredRows), [filteredRows]);
  const interviewerCounts = React.useMemo(
    () => calculateInterviewerCounts(filteredRows),
    [filteredRows],
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
  const lastUpdated = React.useMemo(() => getLastUpdated(filteredRows), [filteredRows]);
  const interviewPoints = React.useMemo(
    () => points.filter((point) => point.kind === "interview"),
    [points],
  );

  const presenceThresholdMs = 15 * 1000;
  const movementThresholdMeters = 10;
  const { trackingPoints, interviewerStatus } = useTrackingStatus({
    trackingRows: realtimeTrackingRows,
    candidateLabels: activeCandidateLabels,
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
    return interviewPoints;
  }, [interviewPoints, mapViewMode, trackingPoints]);
  const mapPointCount = interviewPoints.length;

  const handleBoxSelect = React.useCallback(
    (selected: MapPoint[]) => {
      if (!isHabilitaciones) return;
      setSelectedMapPoints(selected);
      setEnableMessage(null);
    },
    [isHabilitaciones],
  );

  const handleToggleOperator = React.useCallback((id: string) => {
    setSelectedOperatorIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const handleEnableSelection = React.useCallback(async () => {
    if (!selectedOperatorIds.length || !selectedMapPoints.length) return;
    const clientIds = selectedMapPoints
      .map((point) => point.id)
      .filter((value): value is string => Boolean(value));
    if (!clientIds.length) return;
    setSavingAccess(true);
    try {
      await enableFormAccess({
        operatorIds: selectedOperatorIds,
        clientIds,
        enabledBy: "tierra-habilitaciones",
      });
      setEnableMessage("Accesos habilitados correctamente.");
      setSelectedMapPoints([]);
      refreshEnabledClientIds();
    } catch (err) {
      setEnableMessage(err instanceof Error ? err.message : "No se pudo habilitar.");
    } finally {
      setSavingAccess(false);
    }
  }, [refreshEnabledClientIds, selectedMapPoints, selectedOperatorIds]);

  const selectionPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Seleccion
        </p>
        <Badge variant="outline" className="border-border/60 text-foreground">
          {selectedMapPoints.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Arrastra un recuadro en el mapa para seleccionar.
      </p>
      <div className="space-y-2">
        {operators.map((operator) => (
          <div key={operator.id} className="flex items-center gap-3">
            <Checkbox
              checked={selectedOperatorIds.includes(operator.id)}
              onCheckedChange={() => handleToggleOperator(operator.id)}
            />
            <span className="text-sm text-foreground">{operator.name}</span>
          </div>
        ))}
      </div>
      {enabledLoading ? (
        <p className="text-xs text-muted-foreground">Cargando elegibles...</p>
      ) : enabledError ? (
        <p className="text-xs text-red-500">No se pudo validar elegibles.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {filteredRows.length} contactos disponibles.
        </p>
      )}
      {enableMessage ? (
        <p className="text-xs text-muted-foreground">{enableMessage}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleEnableSelection}
          disabled={
            savingAccess ||
            enabledLoading ||
            enabledError ||
            !selectedOperatorIds.length ||
            !selectedMapPoints.length
          }
        >
          {savingAccess ? "Habilitando..." : "Habilitar seleccion"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedMapPoints([])}
          disabled={!selectedMapPoints.length}
        >
          Limpiar
        </Button>
      </div>
    </div>
  );

  React.useEffect(() => {
    let active = true;
    getGeoJson("/geo/departamentos%202.geojson")
      .then((geojson) => {
        if (!active) return;
        setDepartmentGeojson(geojson);
      })
      .catch(() => {
        if (!active) return;
        setDepartmentGeojson(null);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const objectiveByDepartment = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of objectiveSp.departamentos ?? []) {
      const key = normalizeDepartmentName(item.departamento);
      if (!key) continue;
      map.set(key, Number(item.meta_datos_segura) || 0);
    }
    return map;
  }, [normalizeDepartmentName]);

  const objectiveByDepartmentCode = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of objectiveSp.departamentos ?? []) {
      const key = String(item.id ?? "").padStart(2, "0");
      if (!key) continue;
      map.set(key, Number(item.meta_datos_segura) || 0);
    }
    return map;
  }, []);

  const totalObjectiveGoal = React.useMemo(() => {
    return (objectiveSp.departamentos ?? []).reduce(
      (acc, item) => acc + (Number(item.meta_datos_segura) || 0),
      0,
    );
  }, []);

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

  const selectedDepartmentKey = React.useMemo(() => {
    return normalizeDepartmentName(mapSelection?.depName);
  }, [mapSelection?.depName, normalizeDepartmentName]);

  const selectedDepartmentCode = React.useMemo(() => {
    return normalizeDepartmentCode(mapSelection?.depCode ?? null);
  }, [mapSelection?.depCode, normalizeDepartmentCode]);

  const selectedDepartmentFeature = React.useMemo(() => {
    if (!departmentGeojson) return null;
    if (!selectedDepartmentCode && !selectedDepartmentKey) return null;
    return (
      departmentGeojson.features.find((feature) => {
        const props = feature.properties ?? {};
        const code = normalizeDepartmentCode(String(props.CODDEP ?? ""));
        if (selectedDepartmentCode && code === selectedDepartmentCode) return true;
        const name = normalizeDepartmentName(String(props.DEPARTAMEN ?? ""));
        return Boolean(selectedDepartmentKey && name === selectedDepartmentKey);
      }) ?? null
    );
  }, [departmentGeojson, normalizeDepartmentCode, normalizeDepartmentName, selectedDepartmentCode, selectedDepartmentKey]);

  const selectionTotal = React.useMemo(() => {
    if (selectedDepartmentFeature) {
      return rows.reduce((acc, row) => {
        if (row.latitude === null || row.longitude === null) return acc;
        const inside = isPointInGeometry(selectedDepartmentFeature.geometry, {
          lat: row.latitude,
          lng: row.longitude,
        });
        return inside ? acc + 1 : acc;
      }, 0);
    }
    if (selectedDepartmentCode) {
      return interviewCountsByDepartmentCode.get(selectedDepartmentCode) ?? 0;
    }
    if (selectedDepartmentKey) {
      return interviewCountsByDepartment.get(selectedDepartmentKey) ?? 0;
    }
    return total;
  }, [interviewCountsByDepartment, interviewCountsByDepartmentCode, rows, selectedDepartmentCode, selectedDepartmentFeature, selectedDepartmentKey, total]);

  const goalScopeLabel = React.useMemo(() => {
    if (!mapSelection) return null;
    const parts = [mapSelection.depName, mapSelection.provName, mapSelection.distName].filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }, [mapSelection]);

  const interviewerTimelineData = React.useMemo(
    () => generateInterviewerTimelineData(filteredRows, topInterviewerForChart),
    [filteredRows, topInterviewerForChart],
  );

  const totalLabel = total.toLocaleString("en-US");
  const selectionLabel = selectionTotal.toLocaleString("en-US");
  const goalNumeric = React.useMemo(() => {
    if (selectedDepartmentCode) {
      const byCode = objectiveByDepartmentCode.get(selectedDepartmentCode);
      if (typeof byCode === "number") return byCode;
    }
    if (selectedDepartmentKey) {
      return objectiveByDepartment.get(selectedDepartmentKey) ?? 0;
    }
    return totalObjectiveGoal;
  }, [objectiveByDepartment, objectiveByDepartmentCode, selectedDepartmentCode, selectedDepartmentKey, totalObjectiveGoal]);
  const goalProgress = goalNumeric > 0 ? (selectionTotal / goalNumeric) * 100 : 0;
  const goalProgressLabel = goalNumeric > 0 ? `${Math.min(goalProgress, 100).toFixed(2)}%` : "-";
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
  const mapStatus =
    mapViewMode === "tracking"
      ? trackingMapStatus
      : enabledLoading && isHabilitaciones
        ? "loading"
        : baseMapStatus;

  const nowHour = new Date().getHours();
  const nowLabel = `${nowHour.toString().padStart(2, "0")}:00`;

  const updatesFull = React.useMemo(() => {
    return [...filteredRows]
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
  }, [filteredRows]);
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

  const candidateFilters = [
    { id: "all", label: "SOMOS PERU", image: "/images.png" },
    ...candidates.map((candidate) => ({
      id: candidate.id,
      label: candidate.name,
      image: candidate.profile?.image,
    })),
  ];

  const partyProfile = {
    name: "SOMOS PERU",
    party: "Somos Peru",
    role: "Partido politico",
    number: "",
    image: "/images.png",
  };

  const activeProfile =
    activeCandidateId === "all" ? partyProfile : activeCandidate?.profile ?? partyProfile;

  const activeCampaignId =
    activeCandidateId === "all" ? null : activeCandidate?.id ?? null;

  return (
    <EventMapDashboardView
      eventTitle="SOMOS PERU"
      candidateLabels={activeCandidateLabels}
      campaignId={activeCampaignId}
      candidateProfile={{
        name: activeCandidateId === "all" ? partyProfile.name : activeCandidate?.name ?? "",
        party: activeProfile.party,
        role: activeProfile.role,
        number: activeProfile.number,
        image: activeProfile.image,
      }}
      selectionLabel={selectionLabel}
      totalLabel={totalLabel}
      metaDataCountLabel={selectionLabel}
      metaDataGoalLabel={goalNumeric > 0 ? goalNumeric.toLocaleString("en-US") : "-"}
      metaDataProgressLabel={goalProgressLabel}
      metaDataProgress={goalProgress}
      metaVotesCountLabel="0"
      metaVotesGoalLabel="1,100,000"
      metaVotesProgressLabel="0.00%"
      metaVotesProgress={0}
      goalScopeLabel={goalScopeLabel}
      lastUpdatedLabel={lastUpdatedLabel}
      mapViewMode={mapViewMode}
      onMapViewModeChange={setMapViewMode}
      tableRows={filteredRows}
      tableFilterCandidate={activeCandidateId === "all" ? null : activeCandidate?.name ?? null}
      mapStatus={mapStatus}
      mapRef={mapRef}
      resetMapView={resetMapView}
      setResetMapView={setResetMapView}
      mapPointCount={mapPointCount}
      displayMapPoints={displayMapPoints}
      filteredInterviewPoints={interviewPoints}
      onHierarchySelectionChange={setMapSelection}
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
      candidateFilters={candidateFilters}
      activeCandidateId={activeCandidateId}
      onCandidateChange={handleCandidateChange}
      hideMapLegend={false}
      updates={updates}
      updatesFull={updatesFull}
      onUpdateFocus={handleUpdateFocus}
      timelineScope={timelineScope}
      onTimelineScopeChange={setTimelineScope}
      enableBoxSelect={
        mapViewMode === "interview" && habilitacionOpen && eligibilityReady
      }
      onBoxSelect={handleBoxSelect}
      selectionPanel={null}
      headerActions={
        isHabilitaciones ? (
          <Dialog
            open={habilitacionOpen}
            onOpenChange={(open) => {
              setHabilitacionOpen(open);
              if (!open) setSelectedMapPoints([]);
            }}
            modal={false}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-3 text-[11px]">
                Habilitar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" showOverlay={false}>
              <DialogHeader>
                <DialogTitle>Habilitar contactos</DialogTitle>
              </DialogHeader>
              {selectionPanel}
            </DialogContent>
          </Dialog>
        ) : null
      }
    />
  );
};
