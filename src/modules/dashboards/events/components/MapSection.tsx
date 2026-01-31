import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeruMapPanel } from "@/modules/maps/PeruMapPanel";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { MapPoint } from "../utils/dataUtils";
import type { GeoFeatureCollection, GeoLevel } from "@/modules/maps/hierarchy/types";
import type { MapHierarchySelection } from "@/modules/maps/PeruMapPanel";
import useSWR from "swr";

interface MapSectionProps {
  points: MapPoint[];
  hierarchyPoints?: MapPoint[];
  candidateLabels: string[];
  mapStatus: "loading" | "error" | "empty" | undefined;
  mapRef: React.MutableRefObject<MapRef | null>;
  resetMapView: (() => void) | null;
  setResetMapView: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  withLocation: number;
  showLegend?: boolean;
  focusPoint?: { lat: number; lng: number } | null;
  onClearFocusPoint?: () => void;
  campaignId?: string | null;
  onHierarchySelectionChange?: (selection: MapHierarchySelection) => void;
  showMovingOnly?: boolean;
  onToggleMovingOnly?: () => void;
  trackingCount?: number;
  movingTrackingCount?: number;
}

export const MapSection: React.FC<MapSectionProps> = ({
  points,
  hierarchyPoints,
  candidateLabels,
  mapStatus,
  mapRef,
  resetMapView,
  setResetMapView,
  withLocation,
  showLegend = true,
  focusPoint,
  onClearFocusPoint,
  campaignId,
  onHierarchySelectionChange,
  showMovingOnly,
  onToggleMovingOnly,
  trackingCount,
  movingTrackingCount,
}) => {
  const [showStreetBase, setShowStreetBase] = React.useState(true);
  const [currentLevel, setCurrentLevel] = React.useState<GeoLevel>("departamento");
  const getPointColor = React.useCallback((point: MapPoint) => {
    if (point.kind === "tracking") {
      return "#3b82f6";
    }
    if (point.candidate === candidateLabels[0]) return "#10b981";
    if (point.candidate === candidateLabels[1]) return "#3b82f6";
    if (point.candidate === candidateLabels[2]) return "#f97316";
    return "#64748b";
  }, [candidateLabels]);

  const buildGeojsonKey = React.useCallback(
    (layerType: "departamento" | "provincia" | "distrito" | null, metaOnly = false) => {
      if (!campaignId || !layerType) return null;
      const metaParam = metaOnly ? "&meta=1" : "";
      return `/api/geojson?campaignId=${campaignId}&layerType=${layerType}${metaParam}`;
    },
    [campaignId],
  );
  const geojsonFetcher = React.useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error("geojson-failed");
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

  const layerData = React.useMemo(() => {
    return {
      departamento: currentLevel === "departamento" ? activeLayerData : null,
      provincia: currentLevel === "provincia" ? activeLayerData : nextLayer === "provincia" ? nextLayerData : null,
      distrito: currentLevel === "distrito" ? activeLayerData : nextLayer === "distrito" ? nextLayerData : null,
    };
  }, [activeLayerData, currentLevel, nextLayer, nextLayerData]);

  const metaData = React.useMemo(() => {
    return {
      departamento: currentLevel === "departamento" ? activeMetaData : null,
      provincia: currentLevel === "provincia" ? activeMetaData : nextLayer === "provincia" ? nextMetaData : null,
      distrito: currentLevel === "distrito" ? activeMetaData : nextLayer === "distrito" ? nextMetaData : null,
    };
  }, [activeMetaData, currentLevel, nextLayer, nextMetaData]);

  const activeGeojson = React.useMemo(() => {
    const payload = layerData[currentLevel]?.geojson;
    return asFeatureCollection(payload);
  }, [asFeatureCollection, currentLevel, layerData]);
  const activeMeta = React.useMemo(() => metaData[currentLevel]?.meta ?? null, [currentLevel, metaData]);
  const clientLayers = React.useMemo(() => {
    return {
      departamento: asFeatureCollection(layerData.departamento?.geojson),
      provincia: asFeatureCollection(layerData.provincia?.geojson),
      distrito: asFeatureCollection(layerData.distrito?.geojson),
    };
  }, [asFeatureCollection, layerData]);

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

  return (
    <div className="relative h-[70vh] min-h-[520px] rounded-2xl border border-border/60 bg-card/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,_rgba(15,23,42,0.12),_transparent_35%)] dark:bg-[linear-gradient(180deg,_rgba(2,6,23,0.45),_transparent_35%)]" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowStreetBase((value) => !value)}
          className="bg-background/80 backdrop-blur"
        >
          {showStreetBase ? "Ocultar fondo" : "Mostrar fondo"}
        </Button>
        {onToggleMovingOnly ? (
          <Button
            size="sm"
            variant={showMovingOnly ? "default" : "outline"}
            onClick={onToggleMovingOnly}
            className="backdrop-blur"
          >
            {showMovingOnly ? "Ver todo" : "Solo en movimiento"}
          </Button>
        ) : null}
      </div>
      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-border/60 bg-background/75 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
        <p className="font-semibold text-foreground">Mapa Peru</p>
        <p>{withLocation} puntos activos</p>
        {typeof trackingCount === "number" ? (
          <p className="text-[11px] text-muted-foreground">
            Tracking: {trackingCount} · En movimiento: {movingTrackingCount ?? 0}
          </p>
        ) : null}
      </div>
      {showLegend ? (
        <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
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
        focusPoint={focusPoint}
        onClearFocusPoint={onClearFocusPoint}
        onHierarchyLevelChange={setCurrentLevel}
        onHierarchySelectionChange={onHierarchySelectionChange}
        clientGeojson={activeGeojson}
        clientGeojsonMeta={activeMeta}
        clientGeojsonLayers={resolvedClientLayers}
        renderPointTooltip={(point) => (
          point.kind === "tracking" ? (
            <div className="space-y-2 rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 shadow-lg">
              <div className="space-y-1">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                  Entrevistador
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
