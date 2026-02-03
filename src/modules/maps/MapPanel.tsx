"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { MapRef } from "@vis.gl/react-maplibre";
import { Layer, Source } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";
import { mapStyleDark, mapStyleLight, defaultMapView } from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const MaplibreMap = dynamic(
  () => import("@vis.gl/react-maplibre").then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted/40" />,
  },
);

const MapMarker = dynamic(
  () => import("@vis.gl/react-maplibre").then((mod) => mod.Marker),
  { ssr: false },
);

const MapPopup = dynamic(
  () => import("@vis.gl/react-maplibre").then((mod) => mod.Popup),
  { ssr: false },
);

type MapPoint = {
  lat: number;
  lng: number;
  candidate?: string | null;
  interviewer?: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string | null;
  east?: number | null;
  north?: number | null;
  kind?: "interview" | "tracking" | "address" | null;
  online?: boolean | null;
  mode?: string | null;
  signature?: string | null;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  status?: "connected" | "stationary" | "inactive" | null;
  isActive?: boolean;
  isConnected?: boolean;
};

type MapPanelProps = {
  height?: number | null;
  className?: string;
  points?: MapPoint[];
  status?: "loading" | "error" | "empty";
  statusLabel?: string;
  mapStyle?: string | StyleSpecification;
  initialViewState?: { longitude: number; latitude: number; zoom: number };
  maxBounds?: [[number, number], [number, number]];
  onMapLoad?: () => void;
  onMapClick?: (event: MapLayerMouseEvent) => void;
  onMapHover?: (event: MapLayerMouseEvent) => void;
  onMapHoverLeave?: () => void;
  interactiveLayerIds?: string[];
  mapRef?: React.Ref<MapRef | null>;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  getPointColor?: (point: MapPoint) => string;
  enablePointTooltip?: boolean;
  renderPointTooltip?: (point: MapPoint) => React.ReactNode;
  renderPointsAsLayer?: boolean;
  pointLayerId?: string;
  pointLayerRadius?: number;
  pointLayerOpacity?: number;
};

export const MapPanel = ({
  height = 320,
  className,
  points = [],
  status,
  statusLabel,
  mapStyle,
  initialViewState,
  maxBounds,
  onMapLoad,
  onMapClick,
  onMapHover,
  onMapHoverLeave,
  interactiveLayerIds,
  mapRef,
  children,
  overlay,
  getPointColor,
  enablePointTooltip = false,
  renderPointTooltip,
  renderPointsAsLayer = false,
  pointLayerId,
  pointLayerRadius = 5,
  pointLayerOpacity = 0.92,
}: MapPanelProps) => {
  const { mode } = useTheme();
  const resolvedStyle = mapStyle ?? (mode === "dark" ? mapStyleDark : mapStyleLight);
  const showStatus = Boolean(status);
  const [hoveredPoint, setHoveredPoint] = React.useState<MapPoint | null>(null);
  const resolvedPointLayerId = pointLayerId ?? "map-points";
  const pointFeatureCollection = React.useMemo(() => {
    if (!renderPointsAsLayer || points.length === 0) return null;
    const features = points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lng, point.lat],
        },
        properties: {
          lat: point.lat,
          lng: point.lng,
          candidate: point.candidate ?? null,
          interviewer: point.interviewer ?? null,
          name: point.name ?? null,
          phone: point.phone ?? null,
          address: point.address ?? null,
          createdAt: point.createdAt ?? null,
          online: point.online ?? null,
          kind: point.kind ?? null,
          mode: point.mode ?? null,
          signature: point.signature ?? null,
          accuracy: point.accuracy ?? null,
          altitude: point.altitude ?? null,
          speed: point.speed ?? null,
          heading: point.heading ?? null,
          color: getPointColor ? getPointColor(point) : "hsl(var(--primary))",
        },
      }));
    return { type: "FeatureCollection", features } as const;
  }, [getPointColor, points, renderPointsAsLayer]);
  const resolvedInteractiveLayerIds = React.useMemo(() => {
    if (!renderPointsAsLayer) return interactiveLayerIds;
    if (!interactiveLayerIds || interactiveLayerIds.length === 0) {
      return [resolvedPointLayerId];
    }
    return Array.from(new Set([resolvedPointLayerId, ...interactiveLayerIds]));
  }, [interactiveLayerIds, renderPointsAsLayer, resolvedPointLayerId]);
  const handleMapMouseMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!renderPointsAsLayer || !enablePointTooltip) return;
      const feature = event.features?.find((item) => item.layer.id === resolvedPointLayerId);
      if (!feature?.properties) {
        setHoveredPoint((current) => (current ? null : current));
        return;
      }
      const props = feature.properties as Record<string, unknown>;
      const latValue = typeof props.lat === "number" ? props.lat : Number(props.lat);
      const lngValue = typeof props.lng === "number" ? props.lng : Number(props.lng);
      if (!Number.isFinite(latValue) || !Number.isFinite(lngValue)) {
        setHoveredPoint((current) => (current ? null : current));
        return;
      }
      setHoveredPoint((current) => {
        if (current?.lat === latValue && current?.lng === lngValue) return current;
        return {
          lat: latValue,
          lng: lngValue,
          candidate: (props.candidate as string | null | undefined) ?? null,
          interviewer: (props.interviewer as string | null | undefined) ?? null,
          name: (props.name as string | null | undefined) ?? null,
          phone: (props.phone as string | null | undefined) ?? null,
          address: (props.address as string | null | undefined) ?? null,
          createdAt: (props.createdAt as string | null | undefined) ?? null,
          online: (props.online as boolean | null | undefined) ?? null,
          kind: (props.kind as "interview" | "tracking" | "address" | null | undefined) ?? null,
          mode: (props.mode as string | null | undefined) ?? null,
          signature: (props.signature as string | null | undefined) ?? null,
          accuracy: (props.accuracy as number | null | undefined) ?? null,
          altitude: (props.altitude as number | null | undefined) ?? null,
          speed: (props.speed as number | null | undefined) ?? null,
          heading: (props.heading as number | null | undefined) ?? null,
        };
      });
    },
    [enablePointTooltip, renderPointsAsLayer, resolvedPointLayerId],
  );

  const handleMouseMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (renderPointsAsLayer && enablePointTooltip) {
        handleMapMouseMove(event);
      }
      onMapHover?.(event);
    },
    [enablePointTooltip, handleMapMouseMove, onMapHover, renderPointsAsLayer],
  );

  return (
    <div
      className={cn(
        "arcgis-map-panel relative overflow-hidden rounded-[28px] border border-border/50 bg-card/60 shadow-[0_28px_70px_rgba(0,0,0,0.22)]",
        className,
      )}
      style={typeof height === "number" ? { height } : undefined}
    >
      <MaplibreMap
        initialViewState={initialViewState ?? defaultMapView}
        style={{ width: "100%", height: "100%" }}
        mapStyle={resolvedStyle}
        maxBounds={maxBounds}
        onLoad={onMapLoad}
        onClick={onMapClick}
        onMouseMove={onMapHover || renderPointsAsLayer ? handleMouseMove : undefined}
        onMouseLeave={
          onMapHoverLeave || (renderPointsAsLayer && enablePointTooltip)
            ? () => {
                if (renderPointsAsLayer && enablePointTooltip) setHoveredPoint(null);
                onMapHoverLeave?.();
              }
            : undefined
        }
        interactiveLayerIds={resolvedInteractiveLayerIds}
        ref={mapRef}
      >
        {children}
        {renderPointsAsLayer && pointFeatureCollection ? (
          <Source id={`${resolvedPointLayerId}-source`} type="geojson" data={pointFeatureCollection as any}>
            <Layer
              id={`${resolvedPointLayerId}-online`}
              type="circle"
              filter={["all", ["==", ["get", "kind"], "tracking"], ["==", ["get", "online"], true]]}
              paint={{
                "circle-radius": 18,
                "circle-color": "#3b82f6",
                "circle-opacity": 0.22,
              }}
            />
            <Layer
              id={resolvedPointLayerId}
              type="circle"
              paint={{
                "circle-radius": [
                  "case",
                  ["==", ["get", "kind"], "tracking"],
                  4,
                  ["==", ["get", "kind"], "address"],
                  3,
                  pointLayerRadius,
                ],
                "circle-color": ["get", "color"],
                "circle-opacity": [
                  "case",
                  ["==", ["get", "kind"], "address"],
                  0.45,
                  ["==", ["get", "kind"], "tracking"],
                  0.9,
                  pointLayerOpacity,
                ],
                "circle-stroke-color": [
                  "case",
                  ["==", ["get", "kind"], "tracking"],
                  "rgba(255,255,255,0.9)",
                  ["==", ["get", "kind"], "address"],
                  "rgba(255,255,255,0.95)",
                  "rgba(2,6,23,0.35)",
                ],
                "circle-stroke-width": [
                  "case",
                  ["==", ["get", "kind"], "tracking"],
                  1.6,
                  ["==", ["get", "kind"], "address"],
                  1.2,
                  2,
                ],
              }}
            />
            <Layer
              id={`${resolvedPointLayerId}-labels`}
              type="symbol"
              filter={["==", ["get", "kind"], "tracking"]}
              layout={{
                "text-field": ["get", "interviewer"],
                "text-size": 11,
                "text-offset": [0, 1.2],
                "text-anchor": "top",
                "text-allow-overlap": true,
                "text-ignore-placement": true,
              }}
              paint={{
                "text-color": "#f8fafc",
                "text-halo-color": "rgba(15,23,42,0.75)",
                "text-halo-width": 1.4,
              }}
            />
          </Source>
        ) : (
          points.map((point, index) => (
            <MapMarker
              key={`${point.lat}-${point.lng}-${index}`}
              latitude={point.lat}
              longitude={point.lng}
            >
              <button
                type="button"
                className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_4px_rgba(2,6,23,0.35)]"
                style={{
                  backgroundColor: getPointColor ? getPointColor(point) : "hsl(var(--primary))",
                }}
                onMouseEnter={() => enablePointTooltip && setHoveredPoint(point)}
                onMouseLeave={() => enablePointTooltip && setHoveredPoint(null)}
                onClick={() => enablePointTooltip && setHoveredPoint(point)}
              />
            </MapMarker>
          ))
        )}
        {enablePointTooltip && hoveredPoint ? (
          <MapPopup
            longitude={hoveredPoint.lng}
            latitude={hoveredPoint.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={16}
          >
            <div className="min-w-[180px] space-y-1 text-xs">
              {renderPointTooltip ? renderPointTooltip(hoveredPoint) : null}
            </div>
          </MapPopup>
        ) : null}
      </MaplibreMap>
      {overlay ? <div className="absolute right-4 top-4 z-10">{overlay}</div> : null}
      {showStatus ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-semibold text-foreground">
          {statusLabel ??
            (status === "loading"
              ? "Cargando mapa"
              : status === "error"
                ? "Error al cargar mapa"
                : "Sin datos para mostrar")}
        </div>
      ) : null}
    </div>
  );
};
