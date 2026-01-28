"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { StyleSpecification } from "maplibre-gl";
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
  onMapLoad?: () => void;
  mapRef?: React.Ref<MapRef | null>;
  children?: React.ReactNode;
  getPointColor?: (point: { lat: number; lng: number; candidate?: string | null }) => string;
  enablePointTooltip?: boolean;
  renderPointTooltip?: (point: MapPoint) => React.ReactNode;
};

export const MapPanel = ({
  height = 320,
  className,
  points = [],
  status,
  statusLabel,
  mapStyle,
  initialViewState,
  onMapLoad,
  mapRef,
  children,
  getPointColor,
  enablePointTooltip = false,
  renderPointTooltip,
}: MapPanelProps) => {
  const { mode } = useTheme();
  const resolvedStyle = mapStyle ?? (mode === "dark" ? mapStyleDark : mapStyleLight);
  const showStatus = Boolean(status);
  const [hoveredPoint, setHoveredPoint] = React.useState<MapPoint | null>(null);

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
        onLoad={onMapLoad}
        ref={mapRef}
      >
        {children}
        {points.map((point, index) => (
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
        ))}
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
