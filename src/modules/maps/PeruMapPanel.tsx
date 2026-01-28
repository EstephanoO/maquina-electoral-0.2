"use client";

import * as React from "react";
import type { MapRef } from "@vis.gl/react-maplibre";
import { Layer, Source } from "@vis.gl/react-maplibre";
import { MapPanel } from "@/modules/maps/MapPanel";
import { peruMapStyle, defaultMapView } from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";

type PeruGeoJson = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
    properties?: Record<string, unknown>;
  }>;
};


type PeruMapPoint = {
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

type PeruMapPanelProps = {
  height?: number | null;
  className?: string;
  points?: PeruMapPoint[];
  status?: "loading" | "error" | "empty";
  statusLabel?: string;
  geoJsonUrl?: string;
  mapRef?: React.RefObject<MapRef | null>;
  onResetViewReady?: (resetView: () => void) => void;
  getPointColor?: (point: { lat: number; lng: number; candidate?: string | null }) => string;
  enablePointTooltip?: boolean;
  renderPointTooltip?: (point: PeruMapPoint) => React.ReactNode;
};

export const PeruMapPanel = ({
  height,
  className,
  points,
  status,
  statusLabel,
  geoJsonUrl = "/geo/departamentos.geojson",
  mapRef,
  onResetViewReady,
  getPointColor,
  enablePointTooltip,
  renderPointTooltip,
}: PeruMapPanelProps) => {
  const { mode } = useTheme();
  const localMapRef = React.useRef<MapRef | null>(null);
  const resolvedRef = mapRef ?? localMapRef;
  const [geojson, setGeojson] = React.useState<PeruGeoJson | null>(null);
  const [bounds, setBounds] = React.useState<[number, number, number, number] | null>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const fillColor = mode === "dark" ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.08)";
  const lineColor = mode === "dark" ? "rgba(226,232,240,0.6)" : "rgba(15,23,42,0.35)";

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const response = await fetch(geoJsonUrl, { cache: "force-cache" });
      if (!response.ok) return;
      const payload = (await response.json()) as PeruGeoJson;
      if (!isMounted) return;
      setGeojson(payload);
      setBounds(getGeoJsonBounds(payload));
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [geoJsonUrl]);

  const resetView = React.useCallback(() => {
    if (!resolvedRef.current) return;
    if (!bounds) {
      resolvedRef.current.flyTo({
        center: [defaultMapView.longitude, defaultMapView.latitude],
        zoom: defaultMapView.zoom,
        essential: true,
      });
      return;
    }
    resolvedRef.current.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: 24, duration: 600 },
    );
  }, [bounds, resolvedRef]);

  React.useEffect(() => {
    if (!mapReady) return;
    resetView();
  }, [mapReady, resetView]);

  React.useEffect(() => {
    if (!onResetViewReady) return;
    onResetViewReady(resetView);
  }, [onResetViewReady, resetView]);

  return (
    <MapPanel
      height={height}
      className={className}
      points={points}
      status={status}
      statusLabel={statusLabel}
      mapStyle={peruMapStyle}
      onMapLoad={() => setMapReady(true)}
      mapRef={resolvedRef}
      getPointColor={getPointColor}
      enablePointTooltip={enablePointTooltip}
      renderPointTooltip={renderPointTooltip}
    >
      {geojson ? (
        <Source id="peru-departamentos" type="geojson" data={geojson as unknown as any}>
          <Layer
            id="peru-departamentos-fill"
            type="fill"
            paint={{
              "fill-color": fillColor,
              "fill-opacity": 1,
            }}
          />
          <Layer
            id="peru-departamentos-line"
            type="line"
            paint={{
              "line-color": lineColor,
              "line-width": 1.2,
            }}
          />
        </Source>
      ) : null}
    </MapPanel>
  );
};

const getGeoJsonBounds = (payload: PeruGeoJson): [number, number, number, number] => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const addPoint = (coord: number[]) => {
    const [lng, lat] = coord;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  };

  const walkCoordinates = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (coords.length === 2 && coords.every((value) => typeof value === "number")) {
      addPoint(coords as number[]);
      return;
    }
    for (const item of coords) {
      walkCoordinates(item);
    }
  };

  for (const feature of payload.features) {
    if (!feature.geometry) continue;
    walkCoordinates(feature.geometry.coordinates);
  }

  return [minLng, minLat, maxLng, maxLat];
};
