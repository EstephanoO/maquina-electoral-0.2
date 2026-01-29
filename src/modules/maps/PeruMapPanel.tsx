"use client";

import * as React from "react";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { MapRef } from "@vis.gl/react-maplibre";
import { MapPanel } from "@/modules/maps/MapPanel";
import { peruMapStyle, defaultMapView, mapStyleDark, mapStyleLight } from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";
import { getGeoIndex, getGeoJson, getGeoUrls } from "@/modules/maps/hierarchy/geoIndex";
import { MapHierarchyLayers } from "@/modules/maps/hierarchy/MapHierarchyLayers";
import { MapHierarchyControls } from "@/modules/maps/hierarchy/MapHierarchyControls";
import { useMapHierarchy } from "@/modules/maps/hierarchy/useMapHierarchy";
import type { GeoFeatureCollection } from "@/modules/maps/hierarchy/types";
import { findFeatureByPoint } from "@/modules/maps/hierarchy/geoSpatial";
import { Source, Layer } from "@vis.gl/react-maplibre";

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
  mapRef?: React.RefObject<MapRef | null>;
  onResetViewReady?: (resetView: () => void) => void;
  getPointColor?: (point: { lat: number; lng: number; candidate?: string | null }) => string;
  enablePointTooltip?: boolean;
  renderPointTooltip?: (point: PeruMapPoint) => React.ReactNode;
  useStreetBase?: boolean;
  restrictToPeru?: boolean;
  enableHierarchy?: boolean;
  showHierarchyControls?: boolean;
  focusPoint?: { lat: number; lng: number } | null;
  onClearFocusPoint?: () => void;
  clientGeojson?: GeoFeatureCollection | null;
};

export const PeruMapPanel = ({
  height,
  className,
  points,
  status,
  statusLabel,
  mapRef,
  onResetViewReady,
  getPointColor,
  enablePointTooltip,
  renderPointTooltip,
  useStreetBase = false,
  restrictToPeru = false,
  enableHierarchy = true,
  showHierarchyControls = true,
  focusPoint = null,
  onClearFocusPoint,
  clientGeojson = null,
}: PeruMapPanelProps) => {
  const { mode } = useTheme();
  const { level, selectedCodes, breadcrumb, canGoBack, actions } = useMapHierarchy();
  const localMapRef = React.useRef<MapRef | null>(null);
  const resolvedRef = mapRef ?? localMapRef;
  const [departamentos, setDepartamentos] = React.useState<GeoFeatureCollection | null>(null);
  const [provincias, setProvincias] = React.useState<GeoFeatureCollection | null>(null);
  const [distritos, setDistritos] = React.useState<GeoFeatureCollection | null>(null);
  const [bounds, setBounds] = React.useState<[number, number, number, number] | null>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const geoUrls = React.useMemo(() => getGeoUrls(), []);

  const fillColor = mode === "dark" ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)";
  const lineColor = "rgba(24,24,27,0.68)";
  const fillOpacity = useStreetBase ? 0 : mode === "dark" ? 0.24 : 0.2;
  const resolvedMapStyle = useStreetBase
    ? mode === "dark"
      ? mapStyleDark
      : mapStyleLight
    : peruMapStyle;
  const maxBounds = React.useMemo(() => {
    if (!restrictToPeru || !bounds) return undefined;
    const padding = 2.2;
    return [
      [bounds[0] - padding, bounds[1] - padding],
      [bounds[2] + padding, bounds[3] + padding],
    ] as [[number, number], [number, number]];
  }, [bounds, restrictToPeru]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const payload = await getGeoJson(geoUrls.departamentos);
      if (!active) return;
      setDepartamentos(payload);
      setBounds(getGeoJsonBounds(payload));
    };
    load();
    return () => {
      active = false;
    };
  }, [geoUrls.departamentos]);

  React.useEffect(() => {
    if (level === "departamento") return;
    let active = true;
    const load = async () => {
      const payload = await getGeoJson(geoUrls.provincias);
      if (!active) return;
      setProvincias(payload);
    };
    load();
    return () => {
      active = false;
    };
  }, [geoUrls.provincias, level]);

  React.useEffect(() => {
    if (level !== "distrito") return;
    let active = true;
    const load = async () => {
      const payload = await getGeoJson(geoUrls.distritos);
      if (!active) return;
      setDistritos(payload);
    };
    load();
    return () => {
      active = false;
    };
  }, [geoUrls.distritos, level]);

  React.useEffect(() => {
    if (!focusPoint || !enableHierarchy) return;
    let active = true;
    const load = async () => {
      if (!departamentos) {
        const payload = await getGeoJson(geoUrls.departamentos);
        if (!active) return;
        setDepartamentos(payload);
        setBounds(getGeoJsonBounds(payload));
      }
      if (!provincias) {
        const payload = await getGeoJson(geoUrls.provincias);
        if (!active) return;
        setProvincias(payload);
      }
      if (!distritos) {
        const payload = await getGeoJson(geoUrls.distritos);
        if (!active) return;
        setDistritos(payload);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [departamentos, distritos, enableHierarchy, focusPoint, geoUrls.departamentos, geoUrls.distritos, geoUrls.provincias, provincias]);

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
    if (!mapReady || !resolvedRef.current) return;
    getGeoIndex().then((payload) => {
      let nodeId: string | undefined;
      if (level === "distrito") {
        if (selectedCodes.dist) {
          nodeId = payload.byCode.distrito[selectedCodes.dist];
        } else if (selectedCodes.prov) {
          nodeId = payload.byCode.provincia[`${selectedCodes.dep ?? ""}${selectedCodes.prov}`];
        }
      } else if (level === "provincia") {
        if (selectedCodes.prov) {
          nodeId = payload.byCode.provincia[`${selectedCodes.dep ?? ""}${selectedCodes.prov}`];
        } else if (selectedCodes.dep) {
          nodeId = payload.byCode.departamento[selectedCodes.dep];
        }
      } else if (selectedCodes.dep) {
        nodeId = payload.byCode.departamento[selectedCodes.dep];
      }
      if (!nodeId) return;
      const node = payload.nodes[nodeId];
      if (!node) return;
      resolvedRef.current?.fitBounds(
        [
          [node.bbox[0], node.bbox[1]],
          [node.bbox[2], node.bbox[3]],
        ],
        { padding: 24, duration: 650 },
      );
    });
  }, [level, mapReady, resolvedRef, selectedCodes.dep, selectedCodes.dist, selectedCodes.prov]);

  React.useEffect(() => {
    if (!focusPoint || !enableHierarchy) return;
    if (!departamentos) return;
    const distMatch = distritos ? findFeatureByPoint(distritos, focusPoint) : null;
    const provMatch = provincias ? findFeatureByPoint(provincias, focusPoint) : null;
    const depMatch = findFeatureByPoint(departamentos, focusPoint);

    const depCode = depMatch?.properties?.CODDEP ? String(depMatch.properties.CODDEP) : null;
    const provCode = provMatch?.properties?.CODPROV ? String(provMatch.properties.CODPROV) : null;
    const distCode = distMatch?.properties?.UBIGEO ? String(distMatch.properties.UBIGEO) : null;

    if (distCode) {
      actions.selectDistrictByCode(distCode);
      return;
    }
    if (depCode && provCode) {
      actions.selectProvinceByCodes(depCode, provCode);
      return;
    }
    if (depCode) {
      actions.selectDepartmentByCode(depCode);
    }
  }, [actions, departamentos, distritos, enableHierarchy, focusPoint, provincias]);

  React.useEffect(() => {
    if (!onResetViewReady) return;
    onResetViewReady(resetView);
  }, [onResetViewReady, resetView]);

  React.useEffect(() => {
    if (!mapReady) return;
    if (level !== "departamento") return;
    if (selectedCodes.dep || selectedCodes.prov || selectedCodes.dist) return;
    resetView();
  }, [level, mapReady, resetView, selectedCodes.dep, selectedCodes.dist, selectedCodes.prov]);

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!enableHierarchy) return;
      if (focusPoint) {
        onClearFocusPoint?.();
      }
      const feature = event.features?.[0];
      if (!feature?.properties) {
        if (level === "distrito") {
          actions.goBack();
          return;
        }
        if (level === "provincia") {
          actions.goBack();
          return;
        }
        if (level === "departamento") {
          actions.reset();
          resetView();
        }
        return;
      }
      if (level === "departamento") {
        const code = String((feature.properties as Record<string, unknown>).CODDEP ?? "");
        if (code) actions.selectDepartmentByCode(code);
        return;
      }
      if (level === "provincia") {
        const dep = String((feature.properties as Record<string, unknown>).CODDEP ?? "");
        const prov = String((feature.properties as Record<string, unknown>).CODPROV ?? "");
        if (dep && prov) actions.selectProvinceByCodes(dep, prov);
        return;
      }
      if (level === "distrito") {
        const dist = String((feature.properties as Record<string, unknown>).UBIGEO ?? "");
        if (dist) actions.selectDistrictByCode(dist);
      }
    },
    [actions, enableHierarchy, focusPoint, level, onClearFocusPoint, resetView],
  );

  const handleBack = React.useCallback(() => {
    if (focusPoint) {
      onClearFocusPoint?.();
    }
    actions.goBack();
  }, [actions, focusPoint, onClearFocusPoint]);

  const handleReset = React.useCallback(() => {
    if (focusPoint) {
      onClearFocusPoint?.();
    }
    actions.reset();
    resetView();
  }, [actions, focusPoint, onClearFocusPoint, resetView]);

  const interactiveLayerIds = React.useMemo(() => {
    if (!enableHierarchy) return undefined;
    if (level === "departamento") return ["peru-departamentos-fill"];
    if (level === "provincia") return ["peru-provincias-fill"];
    return ["peru-distritos-fill"];
  }, [enableHierarchy, level]);

  return (
    <MapPanel
      height={height}
      className={className}
      points={points}
      status={status}
      statusLabel={statusLabel}
      mapStyle={resolvedMapStyle}
      maxBounds={maxBounds}
      onMapLoad={() => setMapReady(true)}
      onMapClick={handleMapClick}
      interactiveLayerIds={interactiveLayerIds}
      overlay={
        enableHierarchy && showHierarchyControls ? (
          <MapHierarchyControls
            breadcrumb={breadcrumb}
            canGoBack={canGoBack}
            onBack={handleBack}
            onReset={handleReset}
          />
        ) : null
      }
      mapRef={resolvedRef}
      getPointColor={getPointColor}
      enablePointTooltip={enablePointTooltip}
      renderPointTooltip={renderPointTooltip}
    >
      <MapHierarchyLayers
        departamentos={departamentos}
        provincias={provincias}
        distritos={distritos}
        points={points}
        level={level}
        selectedCodes={selectedCodes}
        fillColor={fillColor}
        lineColor={lineColor}
        fillOpacity={fillOpacity}
      />
      {clientGeojson ? (
        <Source id="client-geojson" type="geojson" data={clientGeojson as unknown as any}>
          <Layer
            id="client-geojson-fill"
            type="fill"
            paint={{
              "fill-color": "rgba(15,23,42,0.14)",
              "fill-opacity": useStreetBase ? 0 : 0.35,
            }}
          />
          <Layer
            id="client-geojson-line"
            type="line"
            paint={{
              "line-color": "rgba(15,23,42,0.75)",
              "line-width": 1.4,
            }}
          />
        </Source>
      ) : null}
    </MapPanel>
  );
};

const getGeoJsonBounds = (payload: {
  features: Array<{ geometry: { coordinates: unknown } }>;
}): [number, number, number, number] => {
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
