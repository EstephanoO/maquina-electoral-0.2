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
  createdAt?: string | null;
  east?: number | null;
  north?: number | null;
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
  getPointColor?: (point: { lat: number; lng: number; candidate?: string | null }) => string;
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
  pointLayerRadius = 4,
  pointLayerOpacity = 0.9,
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
          createdAt: point.createdAt ?? null,
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
          createdAt: (props.createdAt as string | null | undefined) ?? null,
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
        "arcgis-map-panel relative overflow-hidden rounded-[28px] border border-border/60 bg-card/60 shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
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
              id={resolvedPointLayerId}
              type="circle"
              paint={{
                "circle-radius": pointLayerRadius,
                "circle-color": ["get", "color"],
                "circle-opacity": pointLayerOpacity,
                "circle-stroke-color": "rgba(2,6,23,0.35)",
                "circle-stroke-width": 2,
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
      {overlay ? <div className="absolute bottom-4 right-4 z-10">{overlay}</div> : null}
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
