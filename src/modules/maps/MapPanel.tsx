"use client";

import * as React from "react";
import { Map as MaplibreMap, Marker } from "@vis.gl/react-maplibre";
import { mapStyleDark, mapStyleLight, defaultMapView } from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

type MapPanelProps = {
  height?: number | null;
  className?: string;
  points?: Array<{ lat: number; lng: number }>;
};

export const MapPanel = ({ height = 320, className, points = [] }: MapPanelProps) => {
  const { mode } = useTheme();
  const mapStyle = mode === "dark" ? mapStyleDark : mapStyleLight;

  return (
    <div
      className={cn(
        "arcgis-map-panel overflow-hidden rounded-[28px] border border-border/60 bg-card/60 shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
        className,
      )}
      style={typeof height === "number" ? { height } : undefined}
    >
      <MaplibreMap
        initialViewState={defaultMapView}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
      >
        {points.map((point, index) => (
          <Marker key={`${point.lat}-${point.lng}-${index}`} latitude={point.lat} longitude={point.lng}>
            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_0_4px_rgba(0,0,0,0.2)]" />
          </Marker>
        ))}
      </MaplibreMap>
    </div>
  );
};
