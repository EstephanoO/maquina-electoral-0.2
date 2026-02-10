import * as React from "react";
import dynamic from "next/dynamic";
import { Card } from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";
import { Maximize2 } from "lucide-react";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { MapPoint } from "@/dashboards/events/utils/dataUtils";
import type {
  GeoFeatureCollection,
  GeoLevel,
  MapHierarchySelection,
} from "@/maps/hierarchy/types";
import useSWR from "swr";

const PeruMapPanel = dynamic(
  () => import("@/ui/maps/PeruMapPanel").then((mod) => mod.PeruMapPanel),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-2xl border border-border/60 bg-muted/20" />
    ),
  },
);

interface MapSectionProps {
  points: MapPoint[];
  hierarchyPoints?: MapPoint[];
  interviewDistrictCodes?: string[];
  candidateLabels: string[];
  mapStatus: "loading" | "error" | "empty" | undefined;
  mapRef: React.MutableRefObject<MapRef | null>;
  resetMapView: (() => void) | null;
  setResetMapView: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  withLocation: number;
  className?: string;
  style?: React.CSSProperties;
  showLegend?: boolean;
  focusPoint?: { lat: number; lng: number } | null;
  onClearFocusPoint?: () => void;
  highlightPoint?: { lat: number; lng: number } | null;
  campaignId?: string | null;
  onHierarchySelectionChange?: (selection: MapHierarchySelection) => void;
  viewMode?: "tracking" | "interview";
  onSetViewMode?: (mode: "tracking" | "interview") => void;
  enableBoxSelect?: boolean;
  onBoxSelect?: (points: MapPoint[]) => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
  points,
  hierarchyPoints,
  interviewDistrictCodes,
  candidateLabels,
  mapStatus,
  mapRef,
  resetMapView,
  setResetMapView,
  withLocation,
  className,
  style,
  showLegend = true,
  focusPoint,
  onClearFocusPoint,
  highlightPoint,
  campaignId,
  onHierarchySelectionChange,
  viewMode = "tracking",
  onSetViewMode,
  enableBoxSelect = false,
  onBoxSelect,
}) => {
  const showStreetBase = true;
  const [currentLevel, setCurrentLevel] = React.useState<GeoLevel>("departamento");
  const isGiovanna = campaignId === "cand-giovanna";
  const isRocio = campaignId === "cand-rocio";
  const [mapSelection, setMapSelection] = React.useState<MapHierarchySelection | null>(null);
  const shouldHighlightPoints = Boolean(hierarchyPoints && hierarchyPoints.length > 0);
  const getPointColor = React.useCallback((point: MapPoint) => {
    if (point.kind === "tracking") {
      if (point.status === "connected") return "#10b981";
      if (point.status === "stationary") return "#f97316";
      if (point.status === "inactive") return "#94a3b8";
      if (point.isActive && point.isConnected) return "#10b981";
      if (point.isActive && point.isMoving === false) return "#f97316";
      if (point.isActive) return "#10b981";
      return "#94a3b8";
    }
    if (point.candidate === candidateLabels[0]) return "#10b981";
    if (point.candidate === candidateLabels[1]) return "#3b82f6";
    if (point.candidate === candidateLabels[2]) return "#f97316";
    return "#64748b";
  }, [candidateLabels]);

  const buildGeojsonKey = React.useCallback(
    (layerType: "departamento" | "provincia" | "distrito" | null, metaOnly = false) => {
      if (!campaignId || !layerType) return null;
      if (campaignId === "cand-giovanna") {
        if (layerType === "departamento") return "/geo/abuelo_giovanna.geojson";
        if (layerType === "provincia") return "/geo/padre_giovanna.geojson";
        return "/geo/nieto_giovanna.geojson";
      }
      const metaParam = metaOnly ? "&meta=1" : "";
      return `/api/geojson?campaignId=${campaignId}&layerType=${layerType}${metaParam}`;
    },
    [campaignId],
  );
  const geojsonFetcher = React.useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error("geojson-failed");
    if (url.endsWith(".geojson")) {
      const geojson = await response.json();
      return { geojson, meta: null } as {
        geojson?: unknown;
        meta?: {
          bbox?: [number, number, number, number] | null;
          featureCount?: number;
          codes?: {
            deps?: string[];
            provs?: Array<{ dep: string; prov: string }>;
            dists?: string[];
          };
        } | null;
      };
    }
    return response.json() as Promise<{
      geojson?: unknown;
      meta?: {
        bbox?: [number, number, number, number] | null;
        featureCount?: number;
        codes?: {
          deps?: string[];
          provs?: Array<{ dep: string; prov: string }>;
          dists?: string[];
        };
      } | null;
    }>;
  }, []);
  const swrOptions = React.useMemo(
    () => ({
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000,
    }),
    [],
  );

  const asFeatureCollection = React.useCallback((payload?: unknown) => {
    const value = payload as GeoFeatureCollection | undefined;
    if (!value || value.type !== "FeatureCollection") return null;
    if (!Array.isArray(value.features)) return null;
    return value as GeoFeatureCollection;
  }, []);

  const nextLayer = currentLevel === "departamento" ? "provincia" : currentLevel === "provincia" ? "distrito" : null;
  const activeLayerKey = buildGeojsonKey(currentLevel);
  const nextLayerKey = buildGeojsonKey(nextLayer);
  const activeMetaKey = buildGeojsonKey(currentLevel, true);
  const nextMetaKey = buildGeojsonKey(nextLayer, true);
  const { data: activeLayerData } = useSWR(activeLayerKey, geojsonFetcher, swrOptions);
  const { data: nextLayerData } = useSWR(nextLayerKey, geojsonFetcher, swrOptions);
  const { data: activeMetaData } = useSWR(activeMetaKey, geojsonFetcher, swrOptions);
  const { data: nextMetaData } = useSWR(nextMetaKey, geojsonFetcher, swrOptions);
  const { data: giovannaDepartamentos } = useSWR(
    isGiovanna ? "/geo/abuelo_giovanna.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: giovannaProvincias } = useSWR(
    isGiovanna ? "/geo/padre_giovanna.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: giovannaDistritos } = useSWR(
    isGiovanna ? "/geo/hijo_giovanna(1).geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: giovannaSectores } = useSWR(
    isGiovanna ? "/geo/nieto_giovanna.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: rocioDepartamentos } = useSWR(
    isRocio ? "/geo/abuelo_rocio.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: rocioProvincias } = useSWR(
    isRocio ? "/geo/padre_rocio.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );
  const { data: rocioDistritos } = useSWR(
    isRocio ? "/geo/hijo_rocio.geojson" : null,
    geojsonFetcher,
    swrOptions,
  );

  const layerData = React.useMemo(() => {
    if (isGiovanna) {
      return {
        departamento: giovannaDepartamentos ?? null,
        provincia: giovannaProvincias ?? null,
        distrito: giovannaDistritos ?? null,
      };
    }
    return {
      departamento: currentLevel === "departamento" ? activeLayerData : null,
      provincia: currentLevel === "provincia" ? activeLayerData : nextLayer === "provincia" ? nextLayerData : null,
      distrito: currentLevel === "distrito" ? activeLayerData : nextLayer === "distrito" ? nextLayerData : null,
    };
  }, [
    activeLayerData,
    currentLevel,
    giovannaDepartamentos,
    giovannaDistritos,
    giovannaProvincias,
    isGiovanna,
    nextLayer,
    nextLayerData,
  ]);

  const metaData = React.useMemo(() => {
    if (isGiovanna) {
      return {
        departamento: null,
        provincia: null,
        distrito: null,
      };
    }
    return {
      departamento: currentLevel === "departamento" ? activeMetaData : null,
      provincia: currentLevel === "provincia" ? activeMetaData : nextLayer === "provincia" ? nextMetaData : null,
      distrito: currentLevel === "distrito" ? activeMetaData : nextLayer === "distrito" ? nextMetaData : null,
    };
  }, [activeMetaData, currentLevel, isGiovanna, nextLayer, nextMetaData]);

  const activeGeojson = React.useMemo(() => {
    const payload = layerData[currentLevel]?.geojson;
    return asFeatureCollection(payload);
  }, [asFeatureCollection, currentLevel, layerData]);
  const activeMeta = React.useMemo(() => metaData[currentLevel]?.meta ?? null, [currentLevel, metaData]);
  const activeSectorGeojson = React.useMemo(() => {
    if (!isGiovanna || !mapSelection?.distCode) return null;
    return asFeatureCollection(giovannaSectores?.geojson);
  }, [asFeatureCollection, giovannaSectores?.geojson, isGiovanna, mapSelection?.distCode]);
  const clientLayers = React.useMemo(() => {
    return {
      departamento: asFeatureCollection(layerData.departamento?.geojson),
      provincia: asFeatureCollection(layerData.provincia?.geojson),
      distrito: asFeatureCollection(layerData.distrito?.geojson),
    };
  }, [asFeatureCollection, layerData]);

  const priorityLayers = React.useMemo(() => {
    if (!isRocio) return null;
    return {
      departamento: asFeatureCollection(rocioDepartamentos?.geojson),
      provincia: asFeatureCollection(rocioProvincias?.geojson),
      distrito: asFeatureCollection(rocioDistritos?.geojson),
    };
  }, [
    asFeatureCollection,
    isRocio,
    rocioDepartamentos?.geojson,
    rocioDistritos?.geojson,
    rocioProvincias?.geojson,
  ]);

  const resolvedClientLayers = React.useMemo(() => {
    if (!clientLayers) return null;
    return {
      departamento: (clientLayers.departamento as any) ?? null,
      provincia: (clientLayers.provincia as any) ?? null,
      distrito: (clientLayers.distrito as any) ?? null,
    };
  }, [clientLayers]);
  const hasClientGeojson = Boolean(
    clientLayers?.departamento || clientLayers?.provincia || clientLayers?.distrito,
  );
  const resolvedMapStatus = mapStatus === "empty" && hasClientGeojson ? undefined : mapStatus;
  const geojsonFeatureCount = React.useMemo(() => {
    const count = activeMeta?.featureCount ?? null;
    if (count && count > 0) return count;
    if (!clientLayers) return null;
    const total =
      (clientLayers.departamento?.features.length ?? 0) +
      (clientLayers.provincia?.features.length ?? 0) +
      (clientLayers.distrito?.features.length ?? 0);
    return total > 0 ? total : null;
  }, [activeMeta?.featureCount, clientLayers]);

  const handleHierarchySelectionChange = React.useCallback(
    (selection: MapHierarchySelection) => {
      setMapSelection(selection);
      onHierarchySelectionChange?.(selection);
    },
    [onHierarchySelectionChange],
  );

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const handleFullscreen = React.useCallback(() => {
    const target = containerRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      target.requestFullscreen?.();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[28px] border border-border/50 bg-card/60 shadow-[0_28px_70px_rgba(15,23,42,0.18)] ${
        className ?? "h-[72vh] min-h-[600px]"
      }`}
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.14),_transparent_35%)] dark:bg-[linear-gradient(180deg,_rgba(2,6,23,0.6),_transparent_35%)]" />
      <div className="sr-only">{withLocation} puntos activos</div>
      {onSetViewMode ? (
        <div className="absolute left-6 top-6 z-10">
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/85 p-1 shadow-sm backdrop-blur">
            <Button
              size="sm"
              variant={viewMode === "tracking" ? "default" : "ghost"}
              className="h-7 rounded-full px-3 text-[11px]"
              onClick={() => onSetViewMode("tracking")}
            >
              Tracking
            </Button>
            <Button
              size="sm"
              variant={viewMode === "interview" ? "default" : "ghost"}
              className="h-7 rounded-full px-3 text-[11px]"
              onClick={() => onSetViewMode("interview")}
            >
              Datos
            </Button>
          </div>
        </div>
      ) : null}
      {showLegend ? (
        <div className="absolute bottom-5 left-5 z-10 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Leyenda
          </p>
          <div className="mt-2 space-y-1">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {candidateLabels[0]}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {candidateLabels[1]}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {candidateLabels[2]}
            </span>
          </div>
        </div>
      ) : null}
      <div className="absolute right-5 top-5 left-auto z-20">
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9"
          onClick={handleFullscreen}
          aria-label="Pantalla completa"
          title="Pantalla completa"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <PeruMapPanel
        height={null}
        className="h-full w-full rounded-2xl"
        points={points}
        hierarchyPoints={hierarchyPoints}
        status={resolvedMapStatus}
        mapRef={mapRef}
        onResetViewReady={setResetMapView}
        useStreetBase={showStreetBase}
        restrictToPeru
        enablePointTooltip
        showTrackingLabels={viewMode !== "tracking"}
        enableBoxSelect={enableBoxSelect}
        onBoxSelect={(selected) => onBoxSelect?.(selected as MapPoint[])}
        focusPoint={focusPoint}
        onClearFocusPoint={onClearFocusPoint}
        highlightPoint={highlightPoint}
        overlayPosition="right"
        onHierarchyLevelChange={setCurrentLevel}
        onHierarchySelectionChange={handleHierarchySelectionChange}
      interviewDistrictCodes={interviewDistrictCodes}
      highlightPoints={shouldHighlightPoints}
      clientGeojson={activeSectorGeojson ?? activeGeojson}
      clientGeojsonMeta={activeMeta}
      clientGeojsonLayers={resolvedClientLayers}
      priorityGeojsonLayers={priorityLayers}
      renderPointTooltip={(point) => (
          point.kind === "tracking" ? (
            <div className="space-y-2 rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 shadow-lg">
              <div className="space-y-1">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                  Agente de campo
                </p>
                <p className="text-sm font-semibold text-white">
                  {point.interviewer ?? "-"}
                </p>
                <p className="text-[11px] text-slate-300">{point.signature ?? ""}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    Estado
                  </p>
                  <p className="text-xs text-white">{point.mode ?? "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    Velocidad
                  </p>
                  <p className="text-xs text-white">
                    {typeof point.speed === "number" ? `${point.speed.toFixed(1)} m/s` : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    Precision
                  </p>
                  <p className="text-xs text-white">
                    {typeof point.accuracy === "number" ? `${point.accuracy.toFixed(1)} m` : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    Hora
                  </p>
                  <p className="text-xs text-white">
                    {point.createdAt
                      ? new Date(point.createdAt).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 shadow-lg">
              <div className="space-y-1">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                  Entrevistado
                </p>
                <p className="text-sm font-semibold text-white">
                  {point.name ?? "-"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    WhatsApp
                  </p>
                  <p className="text-xs text-white">{point.phone ?? "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                    Hora
                  </p>
                  <p className="text-xs text-white">
                    {point.createdAt
                      ? new Date(point.createdAt).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
        getPointColor={getPointColor}
      />
    </div>
  );
};
