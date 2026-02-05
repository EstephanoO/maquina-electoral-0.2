"use client";

import * as React from "react";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { MapRef } from "@vis.gl/react-maplibre";
import { MapPanel } from "@/modules/maps/MapPanel";
import {
  peruMapStyle,
  defaultMapView,
  mapStyleDark,
  mapStyleLight,
} from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";
import {
  getGeoIndex,
  getGeoJson,
  getGeoUrls,
} from "@/modules/maps/hierarchy/geoIndex";
import { MapHierarchyLayers } from "@/modules/maps/hierarchy/MapHierarchyLayers";
import { MapHierarchyControls } from "@/modules/maps/hierarchy/MapHierarchyControls";
import { useMapHierarchy } from "@/modules/maps/hierarchy/useMapHierarchy";
import type {
  GeoFeatureCollection,
  GeoLevel,
} from "@/modules/maps/hierarchy/types";
import {
  findFeatureByPoint,
  isPointInGeometry,
} from "@/modules/maps/hierarchy/geoSpatial";
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
  kind?: "interview" | "tracking" | null;
  mode?: string | null;
  signature?: string | null;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
};

type PeruMapPanelProps = {
  height?: number | null;
  className?: string;
  points?: PeruMapPoint[];
  hierarchyPoints?: PeruMapPoint[];
  status?: "loading" | "error" | "empty";
  statusLabel?: string;
  mapRef?: React.RefObject<MapRef | null>;
  onResetViewReady?: (resetView: () => void) => void;
  getPointColor?: (point: {
    lat: number;
    lng: number;
    candidate?: string | null;
  }) => string;
  enablePointTooltip?: boolean;
  renderPointTooltip?: (point: PeruMapPoint) => React.ReactNode;
  useStreetBase?: boolean;
  restrictToPeru?: boolean;
  enableHierarchy?: boolean;
  showHierarchyControls?: boolean;
  focusPoint?: { lat: number; lng: number } | null;
  onClearFocusPoint?: () => void;
  clientGeojson?: GeoFeatureCollection | null;
  clientGeojsonMeta?: {
    bbox?: [number, number, number, number] | null;
    featureCount?: number;
    codes?: {
      deps?: string[];
      provs?: Array<{ dep: string; prov: string }>;
      dists?: string[];
    };
  } | null;
  clientGeojsonLayers?: {
    departamento?: GeoFeatureCollection | null;
    provincia?: GeoFeatureCollection | null;
    distrito?: GeoFeatureCollection | null;
  } | null;
  geoUrlsOverride?: {
    departamentos: string;
    provincias: string;
    distritos: string;
  };
  onHierarchyLevelChange?: (level: GeoLevel) => void;
  onHierarchySelectionChange?: (selection: MapHierarchySelection) => void;
  enableBoxSelect?: boolean;
  onBoxSelect?: (
    points: PeruMapPoint[],
    bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }
  ) => void;
};

export type MapHierarchySelection = {
  level: GeoLevel;
  depCode?: string;
  provCode?: string;
  distCode?: string;
  depName?: string;
  provName?: string;
  distName?: string;
  pointCount?: number;
};

export const PeruMapPanel = ({
  height,
  className,
  points,
  hierarchyPoints,
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
  clientGeojsonMeta = null,
  clientGeojsonLayers = null,
  geoUrlsOverride,
  onHierarchyLevelChange,
  onHierarchySelectionChange,
  enableBoxSelect = false,
  onBoxSelect,
}: PeruMapPanelProps) => {
  const { mode } = useTheme();
  const { level, selectedCodes, breadcrumb, canGoBack, actions } =
    useMapHierarchy();
  const localMapRef = React.useRef<MapRef | null>(null);
  const resolvedRef = mapRef ?? localMapRef;
  const appliedClientBoundsKeyRef = React.useRef<string | null>(null);
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null);
  const [departamentos, setDepartamentos] =
    React.useState<GeoFeatureCollection | null>(null);
  const [provincias, setProvincias] =
    React.useState<GeoFeatureCollection | null>(null);
  const [distritos, setDistritos] = React.useState<GeoFeatureCollection | null>(
    null,
  );
  const [bounds, setBounds] = React.useState<
    [number, number, number, number] | null
  >(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [hoveredCodes, setHoveredCodes] = React.useState<{
    dep?: string;
    prov?: string;
    dist?: string;
  } | null>(null);
  const [boxSelectionRect, setBoxSelectionRect] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const boxStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const boxCurrentRef = React.useRef<{ x: number; y: number } | null>(null);
  const boxSelectActiveRef = React.useRef(false);
  const dragPanEnabledRef = React.useRef<boolean | null>(null);
  const clientHoverIdRef = React.useRef<number | string | null>(null);

  const updateBoxSelection = React.useCallback(
    (start: { x: number; y: number }, current: { x: number; y: number }) => {
      const left = Math.min(start.x, current.x);
      const top = Math.min(start.y, current.y);
      const width = Math.abs(start.x - current.x);
      const height = Math.abs(start.y - current.y);
      setBoxSelectionRect({ x: left, y: top, width, height });
    },
    [],
  );

  const clientBounds = React.useMemo(() => {
    if (!clientGeojson) return null;
    return getGeoJsonBounds(clientGeojson);
  }, [clientGeojson]);
  const metaBounds = React.useMemo(() => {
    const bbox = clientGeojsonMeta?.bbox ?? null;
    if (!bbox || bbox.length !== 4) return null;
    if (!bbox.every((value) => Number.isFinite(value))) return null;
    return bbox as [number, number, number, number];
  }, [clientGeojsonMeta?.bbox]);
  const clientBoundsKey = React.useMemo(() => {
    const resolvedBounds = clientBounds ?? metaBounds;
    if (!resolvedBounds) return null;
    return resolvedBounds.map((value) => value.toFixed(6)).join(",");
  }, [clientBounds, metaBounds]);

  const geoUrls = React.useMemo(
    () => geoUrlsOverride ?? getGeoUrls(),
    [geoUrlsOverride],
  );

  const fillColor =
    mode === "dark" ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)";
  const lineColor = "rgba(24,24,27,0.68)";
  const fillOpacity = useStreetBase ? 0 : mode === "dark" ? 0.24 : 0.2;
  const highlightFillColor = "rgba(239,68,68,0.35)";
  const highlightFillOpacity = 1;
  const resolvedMapStyle = useStreetBase
    ? mode === "dark"
      ? mapStyleDark
      : mapStyleLight
    : peruMapStyle;
  const maxBounds = React.useMemo(() => {
    if (!restrictToPeru || !bounds) return undefined;
    const padding = 7.5;
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
  }, [
    departamentos,
    distritos,
    enableHierarchy,
    focusPoint,
    geoUrls.departamentos,
    geoUrls.distritos,
    geoUrls.provincias,
    provincias,
  ]);

  const allowedGeoCodes = React.useMemo(() => {
    const metaCodes = clientGeojsonMeta?.codes;
    if (!clientGeojsonLayers && !metaCodes) return null;
    const layers = clientGeojsonLayers ?? {};
    const deps = layers.departamento ? new Set<string>() : null;
    const provs = layers.provincia
      ? new Map<string, { dep: string; prov: string }>()
      : null;
    const dists = layers.distrito ? new Set<string>() : null;
    const depFeatures = layers.departamento?.features ?? [];
    for (const feature of depFeatures) {
      const dep = feature.properties?.CODDEP
        ? String(feature.properties.CODDEP)
        : null;
      if (dep && deps) deps.add(dep);
    }
    const provFeatures = layers.provincia?.features ?? [];
    for (const feature of provFeatures) {
      const dep = feature.properties?.CODDEP
        ? String(feature.properties.CODDEP)
        : null;
      const prov = feature.properties?.CODPROV
        ? String(feature.properties.CODPROV)
        : null;
      if (dep && prov && provs) {
        provs.set(`${dep}-${prov}`, { dep, prov });
      }
    }
    const distFeatures = layers.distrito?.features ?? [];
    for (const feature of distFeatures) {
      const dist = feature.properties?.UBIGEO
        ? String(feature.properties.UBIGEO)
        : null;
      if (dist && dists) dists.add(dist);
    }
    if (metaCodes?.deps && deps) {
      for (const dep of metaCodes.deps) deps.add(dep);
    }
    if (metaCodes?.provs && provs) {
      for (const prov of metaCodes.provs) {
        provs.set(`${prov.dep}-${prov.prov}`, {
          dep: prov.dep,
          prov: prov.prov,
        });
      }
    }
    if (metaCodes?.dists && dists) {
      for (const dist of metaCodes.dists) dists.add(dist);
    }
    return {
      deps: deps ? Array.from(deps) : null,
      provs: provs ? Array.from(provs.values()) : null,
      dists: dists ? Array.from(dists) : null,
    };
  }, [clientGeojsonLayers, clientGeojsonMeta?.codes]);

  const allowedPointCodes = React.useMemo(() => {
    if (!points || points.length === 0) return null;
    if (level === "departamento" && departamentos) {
      const deps = new Set<string>();
      for (const point of points) {
        const match = findFeatureByPoint(departamentos, point);
        const dep = match?.properties?.CODDEP
          ? String(match.properties.CODDEP)
          : null;
        if (dep) deps.add(dep);
      }
      return { deps: Array.from(deps), provs: null, dists: null };
    }
    if (level === "provincia" && provincias) {
      const provs = new Map<string, { dep: string; prov: string }>();
      for (const point of points) {
        const match = findFeatureByPoint(provincias, point);
        const dep = match?.properties?.CODDEP
          ? String(match.properties.CODDEP)
          : null;
        const prov = match?.properties?.CODPROV
          ? String(match.properties.CODPROV)
          : null;
        if (dep && prov) {
          provs.set(`${dep}-${prov}`, { dep, prov });
        }
      }
      return { deps: null, provs: Array.from(provs.values()), dists: null };
    }
    if (level === "distrito" && distritos) {
      const dists = new Set<string>();
      for (const point of points) {
        const match = findFeatureByPoint(distritos, point);
        const dist = match?.properties?.UBIGEO
          ? String(match.properties.UBIGEO)
          : null;
        if (dist) dists.add(dist);
      }
      return { deps: null, provs: null, dists: Array.from(dists) };
    }
    return null;
  }, [departamentos, distritos, level, points, provincias]);

  const selectionFeature = React.useMemo(() => {
    if (level === "departamento") {
      if (!selectedCodes.dep || !departamentos) return null;
      return (
        departamentos.features.find(
          (feature) =>
            String(feature.properties?.CODDEP ?? "") === selectedCodes.dep,
        ) ?? null
      );
    }
    if (level === "provincia") {
      if (selectedCodes.dep && selectedCodes.prov && provincias) {
        return (
          provincias.features.find(
            (feature) =>
              String(feature.properties?.CODDEP ?? "") === selectedCodes.dep &&
              String(feature.properties?.CODPROV ?? "") === selectedCodes.prov,
          ) ?? null
        );
      }
      if (selectedCodes.dep && departamentos) {
        return (
          departamentos.features.find(
            (feature) =>
              String(feature.properties?.CODDEP ?? "") === selectedCodes.dep,
          ) ?? null
        );
      }
      return null;
    }
    if (level === "distrito") {
      if (selectedCodes.dist && distritos) {
        return (
          distritos.features.find(
            (feature) =>
              String(feature.properties?.UBIGEO ?? "") === selectedCodes.dist,
          ) ?? null
        );
      }
      if (selectedCodes.dep && selectedCodes.prov && provincias) {
        return (
          provincias.features.find(
            (feature) =>
              String(feature.properties?.CODDEP ?? "") === selectedCodes.dep &&
              String(feature.properties?.CODPROV ?? "") === selectedCodes.prov,
          ) ?? null
        );
      }
      if (selectedCodes.dep && departamentos) {
        return (
          departamentos.features.find(
            (feature) =>
              String(feature.properties?.CODDEP ?? "") === selectedCodes.dep,
          ) ?? null
        );
      }
    }
    return null;
  }, [
    departamentos,
    distritos,
    level,
    provincias,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
  ]);

  const hierarchyPointsForCount = hierarchyPoints ?? points ?? [];

  const selectionPointCount = React.useMemo(() => {
    if (!hierarchyPointsForCount || hierarchyPointsForCount.length === 0) return 0;
    const hasSelection = Boolean(
      selectedCodes.dep || selectedCodes.prov || selectedCodes.dist,
    );
    if (!selectionFeature?.geometry) return hasSelection ? 0 : hierarchyPointsForCount.length;
    let count = 0;
    for (const point of hierarchyPointsForCount) {
      if (isPointInGeometry(selectionFeature.geometry, point)) count += 1;
    }
    return count;
  }, [
    hierarchyPointsForCount,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
    selectionFeature,
  ]);

  const isSectorLayerActive = React.useMemo(
    () => level === "distrito" && Boolean(selectedCodes.dist) && Boolean(clientGeojson),
    [clientGeojson, level, selectedCodes.dist],
  );

  const activeClientLayer = React.useMemo(() => {
    if (level === "distrito" && isSectorLayerActive) {
      return clientGeojson ?? null;
    }
    if (!clientGeojsonLayers) return null;
    if (level === "departamento")
      return clientGeojsonLayers.departamento ?? null;
    if (level === "provincia") return clientGeojsonLayers.provincia ?? null;
    return clientGeojsonLayers.distrito ?? null;
  }, [clientGeojson, clientGeojsonLayers, isSectorLayerActive, level]);

  const clickablePointCodes = React.useMemo(() => {
    if (!allowedPointCodes) return null;
    if (!activeClientLayer || !allowedGeoCodes) return allowedPointCodes;
    return {
      deps: allowedPointCodes.deps
        ? allowedPointCodes.deps.filter(
            (code) => !allowedGeoCodes.deps?.includes(code),
          )
        : null,
      provs: allowedPointCodes.provs
        ? allowedPointCodes.provs.filter(
            (item) =>
              !allowedGeoCodes.provs?.some(
                (blocked) =>
                  blocked.dep === item.dep && blocked.prov === item.prov,
              ),
          )
        : null,
      dists: allowedPointCodes.dists
        ? allowedPointCodes.dists.filter(
            (code) => !allowedGeoCodes.dists?.includes(code),
          )
        : null,
    };
  }, [activeClientLayer, allowedGeoCodes, allowedPointCodes]);

  const clickableCodes = React.useMemo(() => {
    if (!clickablePointCodes && !allowedGeoCodes) return null;
    return {
      deps: Array.from(
        new Set([
          ...(allowedGeoCodes?.deps ?? []),
          ...(clickablePointCodes?.deps ?? []),
        ]),
      ),
      provs: Array.from(
        new Map(
          [
            ...(allowedGeoCodes?.provs ?? []),
            ...(clickablePointCodes?.provs ?? []),
          ].map((item) => [`${item.dep}-${item.prov}`, item]),
        ).values(),
      ),
      dists: Array.from(
        new Set([
          ...(allowedGeoCodes?.dists ?? []),
          ...(clickablePointCodes?.dists ?? []),
        ]),
      ),
    };
  }, [allowedGeoCodes, clickablePointCodes]);

  const clientLayerFilter = React.useMemo(() => {
    if (level === "departamento") {
      return selectedCodes.dep
        ? (["==", ["get", "CODDEP"], selectedCodes.dep] as any)
        : (null as any);
    }
    if (level === "provincia") {
      if (selectedCodes.dep && selectedCodes.prov) {
        return [
          "all",
          ["==", ["get", "CODDEP"], selectedCodes.dep],
          ["==", ["get", "CODPROV"], selectedCodes.prov],
        ] as any;
      }
      if (selectedCodes.dep) {
        return ["==", ["get", "CODDEP"], selectedCodes.dep] as any;
      }
      return null as any;
    }
    if (level === "distrito") {
      if (selectedCodes.dist) {
        const filter: any[] = ["==", ["get", "UBIGEO"], selectedCodes.dist];
        if (isSectorLayerActive && selectedSector) {
          return [
            "all",
            filter,
            ["==", ["to-string", ["get", "SECTOR"]], selectedSector],
          ] as any;
        }
        return filter as any;
      }
      if (selectedCodes.dep && selectedCodes.prov) {
        const filter: any[] = [
          "all",
          ["==", ["get", "CODDEP"], selectedCodes.dep],
          ["==", ["get", "CODPROV"], selectedCodes.prov],
        ];
        return filter as any;
      }
      return null as any;
    }
    return null as any;
  }, [
    isSectorLayerActive,
    level,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
    selectedSector,
  ]);

  const clientFillFilter = React.useMemo(() => {
    const geometryFilter = [
      "match",
      ["geometry-type"],
      ["Polygon", "MultiPolygon"],
      true,
      false,
    ] as any;
    if (!clientLayerFilter) return geometryFilter;
    return ["all", clientLayerFilter, geometryFilter] as any;
  }, [clientLayerFilter]);

  const clientLineFilter = React.useMemo(() => {
    const geometryFilter = [
      "match",
      ["geometry-type"],
      ["LineString", "MultiLineString", "Polygon", "MultiPolygon"],
      true,
      false,
    ] as any;
    if (!clientLayerFilter) return geometryFilter;
    return ["all", clientLayerFilter, geometryFilter] as any;
  }, [clientLayerFilter]);

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
    const resolvedBounds = clientBounds ?? metaBounds;
    if (!resolvedBounds) return;
    if (!clientBoundsKey) return;
    if (points && points.length > 0) return;
    if (appliedClientBoundsKeyRef.current === clientBoundsKey) return;
    resolvedRef.current.fitBounds(
      [
        [resolvedBounds[0], resolvedBounds[1]],
        [resolvedBounds[2], resolvedBounds[3]],
      ],
      { padding: 24, duration: 650 },
    );
    appliedClientBoundsKeyRef.current = clientBoundsKey;
  }, [
    clientBounds,
    clientBoundsKey,
    mapReady,
    metaBounds,
    points,
    resolvedRef,
  ]);

  React.useEffect(() => {
    if (!mapReady || !resolvedRef.current) return;
    getGeoIndex().then((payload) => {
      if (onHierarchySelectionChange) {
        const depCode = selectedCodes.dep;
        const provCode = selectedCodes.prov;
        const distCode = selectedCodes.dist;
        const selection: MapHierarchySelection = {
          level,
          depCode,
          provCode,
          distCode,
        };

        const depId = depCode
          ? payload.byCode.departamento[depCode]
          : undefined;
        const depNode = depId ? payload.nodes[depId] : undefined;
        if (depNode) selection.depName = depNode.name;

        if (depCode && provCode) {
          const provId = payload.byCode.provincia[`${depCode}${provCode}`];
          const provNode = provId ? payload.nodes[provId] : undefined;
          if (provNode) selection.provName = provNode.name;
          if (!selection.depName && provNode?.parentId) {
            selection.depName = payload.nodes[provNode.parentId]?.name;
          }
        }

        if (distCode) {
          const distId = payload.byCode.distrito[distCode];
          const distNode = distId ? payload.nodes[distId] : undefined;
          if (distNode) selection.distName = distNode.name;
          if (distNode?.parentId) {
            const provNode = payload.nodes[distNode.parentId];
            if (provNode && !selection.provName)
              selection.provName = provNode.name;
            if (provNode?.parentId && !selection.depName) {
              selection.depName = payload.nodes[provNode.parentId]?.name;
            }
          }
        }

        selection.pointCount = selectionPointCount;
        onHierarchySelectionChange(selection);
      }
      let nodeId: string | undefined;
      if (level === "distrito") {
        if (selectedCodes.dist) {
          nodeId = payload.byCode.distrito[selectedCodes.dist];
        } else if (selectedCodes.prov) {
          nodeId =
            payload.byCode.provincia[
              `${selectedCodes.dep ?? ""}${selectedCodes.prov}`
            ];
        }
      } else if (level === "provincia") {
        if (selectedCodes.prov) {
          nodeId =
            payload.byCode.provincia[
              `${selectedCodes.dep ?? ""}${selectedCodes.prov}`
            ];
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
  }, [
    level,
    mapReady,
    onHierarchySelectionChange,
    resolvedRef,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
    selectionPointCount,
  ]);

  React.useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      getGeoIndex();
      getGeoJson(geoUrls.provincias);
      getGeoJson(geoUrls.distritos);
    };
    const idle = (
      window as typeof window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout?: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;
    if (idle) {
      const id = idle(warm, { timeout: 2000 });
      return () => {
        cancelled = true;
        (
          window as typeof window & {
            cancelIdleCallback?: (id: number) => void;
          }
        ).cancelIdleCallback?.(id);
      };
    }
    const timeoutId = window.setTimeout(warm, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [geoUrls.distritos, geoUrls.provincias, mapReady]);

  React.useEffect(() => {
    if (!focusPoint || !enableHierarchy) return;
    if (!departamentos) return;
    const distMatch = distritos
      ? findFeatureByPoint(distritos, focusPoint)
      : null;
    const provMatch = provincias
      ? findFeatureByPoint(provincias, focusPoint)
      : null;
    const depMatch = findFeatureByPoint(departamentos, focusPoint);

    const depCode = depMatch?.properties?.CODDEP
      ? String(depMatch.properties.CODDEP)
      : null;
    const provCode = provMatch?.properties?.CODPROV
      ? String(provMatch.properties.CODPROV)
      : null;
    const distCode = distMatch?.properties?.UBIGEO
      ? String(distMatch.properties.UBIGEO)
      : null;
    const allowDep = depCode
      ? Boolean(clickableCodes?.deps?.includes(depCode))
      : false;
    const allowProv =
      depCode && provCode
        ? Boolean(
            clickableCodes?.provs?.some(
              (item: { dep: string; prov: string }) =>
                item.dep === depCode && item.prov === provCode,
            ),
          )
        : false;
    const allowDist = distCode
      ? Boolean(clickableCodes?.dists?.includes(distCode))
      : false;

    if (distCode && allowDist) {
      actions.selectDistrictByCode(distCode);
      return;
    }
    if (depCode && provCode && allowProv) {
      actions.selectProvinceByCodes(depCode, provCode);
      return;
    }
    if (depCode && allowDep) {
      actions.selectDepartmentByCode(depCode);
    }
  }, [
    actions,
    clickableCodes,
    departamentos,
    distritos,
    enableHierarchy,
    focusPoint,
    provincias,
  ]);

  React.useEffect(() => {
    if (!onResetViewReady) return;
    onResetViewReady(resetView);
  }, [onResetViewReady, resetView]);

  React.useEffect(() => {
    if (!onHierarchyLevelChange) return;
    onHierarchyLevelChange(level);
  }, [level, onHierarchyLevelChange]);

  React.useEffect(() => {
    if (!mapReady) return;
    if (level !== "departamento") return;
    if (selectedCodes.dep || selectedCodes.prov || selectedCodes.dist) return;
    resetView();
  }, [
    level,
    mapReady,
    resetView,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
  ]);

  React.useEffect(() => {
    if (level !== "distrito" && selectedSector) {
      setSelectedSector(null);
    }
  }, [level, selectedSector]);

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!enableHierarchy && !activeClientLayer) return;
      if (focusPoint) {
        onClearFocusPoint?.();
      }
      const pointFeature = event.features?.find(
        (item) => item.layer.id === "peru-points",
      );
      if (pointFeature?.properties) {
        const props = pointFeature.properties as Record<string, unknown>;
        const lat =
          typeof props.lat === "number" ? props.lat : Number(props.lat);
        const lng =
          typeof props.lng === "number" ? props.lng : Number(props.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const point = { lat, lng };
          if (level === "departamento" && departamentos) {
            const match = findFeatureByPoint(departamentos, point);
            const dep = match?.properties?.CODDEP
              ? String(match.properties.CODDEP)
              : "";
            if (dep) {
              actions.selectDepartmentByCode(dep);
              return;
            }
          }
          if (level === "provincia" && provincias) {
            const match = findFeatureByPoint(provincias, point);
            const dep = match?.properties?.CODDEP
              ? String(match.properties.CODDEP)
              : "";
            const prov = match?.properties?.CODPROV
              ? String(match.properties.CODPROV)
              : "";
            if (dep && prov) {
              actions.selectProvinceByCodes(dep, prov);
              return;
            }
          }
          if (level === "distrito" && distritos) {
            const match = findFeatureByPoint(distritos, point);
            const dist = match?.properties?.UBIGEO
              ? String(match.properties.UBIGEO)
              : "";
            if (dist) {
              actions.selectDistrictByCode(dist);
              return;
            }
          }
        }
      }
      if (!enableHierarchy && activeClientLayer) {
        const clientFeature = event.features?.find(
          (item) => item.layer?.id === "client-geojson-fill",
        );
        if (clientFeature?.geometry) {
          const bounds = getGeoJsonBounds({
            features: [clientFeature as { geometry: { coordinates: unknown } }],
          });
          resolvedRef.current?.fitBounds(
            [
              [bounds[0], bounds[1]],
              [bounds[2], bounds[3]],
            ],
            { padding: 24, duration: 650 },
          );
          return;
        }
      }
      const feature = event.features?.find((item) => {
        const props = item?.properties as Record<string, unknown> | undefined;
        return Boolean(props?.CODDEP || props?.CODPROV || props?.UBIGEO);
      });
      const sectorFeature =
        level === "distrito" && activeClientLayer
          ? event.features?.find((item) => {
              if (item.layer?.id !== "client-geojson-fill") return false;
              const props = item?.properties as Record<string, unknown> | undefined;
              return props?.SECTOR !== undefined && props?.SECTOR !== null;
            })
          : undefined;
      if (!feature?.properties) {
        if (level === "distrito" && selectedSector) {
          setSelectedSector(null);
          if (selectionFeature?.geometry) {
            const bounds = getGeoJsonBounds({
              features: [selectionFeature as { geometry: { coordinates: unknown } }],
            });
            resolvedRef.current?.fitBounds(
              [
                [bounds[0], bounds[1]],
                [bounds[2], bounds[3]],
              ],
              { padding: 24, duration: 650 },
            );
          }
          return;
        }
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
      if (!enableHierarchy && activeClientLayer) {
        const dist = String(
          (feature.properties as Record<string, unknown>).UBIGEO ?? "",
        );
        if (dist) {
          actions.selectDistrictByCode(dist);
          return;
        }
        const dep = String(
          (feature.properties as Record<string, unknown>).CODDEP ?? "",
        );
        const prov = String(
          (feature.properties as Record<string, unknown>).CODPROV ?? "",
        );
        if (dep && prov) {
          actions.selectProvinceByCodes(dep, prov);
          return;
        }
        if (dep) {
          actions.selectDepartmentByCode(dep);
        }
        return;
      }
      if (level === "departamento") {
        const code = String(
          (feature.properties as Record<string, unknown>).CODDEP ?? "",
        );
        const isAllowed = clickableCodes?.deps ? clickableCodes.deps.includes(code) : true;
        if (code && isAllowed) {
          actions.selectDepartmentByCode(code);
        }
        return;
      }
      if (level === "provincia") {
        const dep = String(
          (feature.properties as Record<string, unknown>).CODDEP ?? "",
        );
        const prov = String(
          (feature.properties as Record<string, unknown>).CODPROV ?? "",
        );
        if (dep && prov) {
          const isAllowed = clickableCodes?.provs
            ? clickableCodes.provs.some(
                (item: { dep: string; prov: string }) =>
                  item.dep === dep && item.prov === prov,
              )
            : true;
          if (isAllowed) actions.selectProvinceByCodes(dep, prov);
        }
        return;
      }
      if (level === "distrito") {
        const sectorValue = (sectorFeature?.properties as Record<string, unknown> | undefined)?.SECTOR;
        if (sectorValue !== null && sectorValue !== undefined) {
          const sector = String(sectorValue);
          if (selectedSector === sector) {
            setSelectedSector(null);
            if (selectionFeature?.geometry) {
              const bounds = getGeoJsonBounds({
                features: [selectionFeature as { geometry: { coordinates: unknown } }],
              });
              resolvedRef.current?.fitBounds(
                [
                  [bounds[0], bounds[1]],
                  [bounds[2], bounds[3]],
                ],
                { padding: 24, duration: 650 },
              );
            }
          } else {
            setSelectedSector(sector);
            if (sectorFeature?.geometry) {
              const bounds = getGeoJsonBounds({
                features: [sectorFeature as { geometry: { coordinates: unknown } }],
              });
              resolvedRef.current?.fitBounds(
                [
                  [bounds[0], bounds[1]],
                  [bounds[2], bounds[3]],
                ],
                { padding: 24, duration: 650 },
              );
            }
          }
          return;
        }
        const dist = String(
          (feature.properties as Record<string, unknown>).UBIGEO ?? "",
        );
        const isAllowed = clickableCodes?.dists
          ? clickableCodes.dists.includes(dist)
          : true;
        if (dist && isAllowed) {
          if (selectedSector) setSelectedSector(null);
          actions.selectDistrictByCode(dist);
        }
      }
    },
    [
      activeClientLayer,
      actions,
      clickableCodes,
      departamentos,
      distritos,
      enableHierarchy,
      focusPoint,
      level,
      onClearFocusPoint,
      provincias,
      resolvedRef,
      resetView,
      selectedSector,
      selectionFeature,
    ],
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

  const handleBoxSelectStart = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!enableBoxSelect) return;
      const originalEvent = event.originalEvent as MouseEvent | undefined;
      if (!originalEvent?.shiftKey || originalEvent.button !== 0) return;
      const start = { x: event.point.x, y: event.point.y };
      boxStartRef.current = start;
      boxCurrentRef.current = start;
      boxSelectActiveRef.current = true;
      updateBoxSelection(start, start);
      const map = resolvedRef.current;
      if (map?.dragPan) {
        dragPanEnabledRef.current = map.dragPan.isEnabled?.() ?? null;
        map.dragPan.disable();
      }
    },
    [enableBoxSelect, resolvedRef, updateBoxSelection],
  );

  const handleBoxSelectEnd = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!boxSelectActiveRef.current) return;
      boxSelectActiveRef.current = false;
      setBoxSelectionRect(null);
      const start = boxStartRef.current;
      const end = boxCurrentRef.current ?? start;
      const map = resolvedRef.current;
      if (map?.dragPan && dragPanEnabledRef.current !== null) {
        if (dragPanEnabledRef.current) map.dragPan.enable();
        else map.dragPan.disable();
        dragPanEnabledRef.current = null;
      }
      if (!start || !end || !map) return;
      const width = Math.abs(start.x - end.x);
      const height = Math.abs(start.y - end.y);
      if (width < 6 || height < 6) return;
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      const sw = map.unproject([minX, maxY]);
      const ne = map.unproject([maxX, minY]);
      const minLng = Math.min(sw.lng, ne.lng);
      const maxLng = Math.max(sw.lng, ne.lng);
      const minLat = Math.min(sw.lat, ne.lat);
      const maxLat = Math.max(sw.lat, ne.lat);
      const selection = (points ?? []).filter((point) => {
        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
        return (
          point.lng >= minLng &&
          point.lng <= maxLng &&
          point.lat >= minLat &&
          point.lat <= maxLat
        );
      });
      onBoxSelect?.(selection, { minLng, minLat, maxLng, maxLat });
    },
    [onBoxSelect, points, resolvedRef],
  );

  React.useEffect(() => {
    if (!enableBoxSelect) return;
    const handleMouseUp = () => {
      if (!boxSelectActiveRef.current) return;
      boxSelectActiveRef.current = false;
      setBoxSelectionRect(null);
      const map = resolvedRef.current;
      if (map?.dragPan && dragPanEnabledRef.current !== null) {
        if (dragPanEnabledRef.current) map.dragPan.enable();
        else map.dragPan.disable();
        dragPanEnabledRef.current = null;
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [enableBoxSelect, resolvedRef]);

  const clearHover = React.useCallback(() => {
    setHoveredCodes(null);
    const map = resolvedRef.current?.getMap?.();
    const hasClientSource = map?.getSource?.("client-geojson");
    if (map && hasClientSource && clientHoverIdRef.current !== null) {
      map.setFeatureState(
        { source: "client-geojson", id: clientHoverIdRef.current },
        { hover: false },
      );
      clientHoverIdRef.current = null;
    }
    const canvas = resolvedRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = "";
  }, [resolvedRef]);

  const handleMapHover = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (enableBoxSelect && boxSelectActiveRef.current) {
        const start = boxStartRef.current;
        const current = { x: event.point.x, y: event.point.y };
        boxCurrentRef.current = current;
        if (start) updateBoxSelection(start, current);
        return;
      }
      if (!enableHierarchy && !activeClientLayer) return;
      const map = resolvedRef.current?.getMap?.();
      const clientFeature = activeClientLayer
        ? event.features?.find((item) => item.layer?.id === "client-geojson-fill")
        : null;
      const clientId =
        typeof clientFeature?.id === "number" || typeof clientFeature?.id === "string"
          ? clientFeature.id
          : null;
      const hasClientSource = map?.getSource?.("client-geojson");
      if (map && hasClientSource && activeClientLayer) {
        if (clientHoverIdRef.current !== null && clientHoverIdRef.current !== clientId) {
          map.setFeatureState(
            { source: "client-geojson", id: clientHoverIdRef.current },
            { hover: false },
          );
        }
        if (clientId !== null && clientHoverIdRef.current !== clientId) {
          map.setFeatureState(
            { source: "client-geojson", id: clientId },
            { hover: true },
          );
        }
        clientHoverIdRef.current = clientId;
      }
      if (isSectorLayerActive) {
        if (!clientFeature?.properties || (clientFeature.properties as Record<string, unknown>).SECTOR == null) {
          clearHover();
          return;
        }
        const canvas = resolvedRef.current?.getCanvas();
        if (canvas) canvas.style.cursor = "pointer";
        return;
      }
      if (clientFeature?.properties) {
        const canvas = resolvedRef.current?.getCanvas();
        if (canvas) canvas.style.cursor = "pointer";
        if (!enableHierarchy) return;
      }
      if (!enableHierarchy && activeClientLayer) {
        if (!clientFeature?.properties) {
          clearHover();
          return;
        }
        return;
      }
      const feature = event.features?.find((item) => item?.properties);
      if (!feature?.properties) {
        clearHover();
        return;
      }
      const props = feature.properties as Record<string, unknown>;
      if (level === "departamento") {
        const dep = props.CODDEP ? String(props.CODDEP) : "";
        const isAllowed = clickableCodes?.deps ? clickableCodes.deps.includes(dep) : true;
        if (!dep || !isAllowed) {
          clearHover();
          return;
        }
        setHoveredCodes({ dep });
      } else if (level === "provincia") {
        const dep = props.CODDEP ? String(props.CODDEP) : "";
        const prov = props.CODPROV ? String(props.CODPROV) : "";
        const isAllowed = clickableCodes?.provs
          ? clickableCodes.provs.some(
              (item: { dep: string; prov: string }) =>
                item.dep === dep && item.prov === prov,
            )
          : true;
        if (!isAllowed) {
          clearHover();
          return;
        }
        setHoveredCodes({ dep, prov });
      } else if (level === "distrito") {
        const dist = props.UBIGEO ? String(props.UBIGEO) : "";
        const isAllowed = clickableCodes?.dists
          ? clickableCodes.dists.includes(dist)
          : true;
        if (!dist || !isAllowed) {
          clearHover();
          return;
        }
        setHoveredCodes({ dist });
      }
      const canvas = resolvedRef.current?.getCanvas();
      if (canvas) canvas.style.cursor = "pointer";
    },
    [
      activeClientLayer,
      clearHover,
      clickableCodes,
      enableBoxSelect,
      enableHierarchy,
      isSectorLayerActive,
      level,
      resolvedRef,
      updateBoxSelection,
    ],
  );

  const interactiveLayerIds = React.useMemo(() => {
    const ids: string[] = [];
    if (enableHierarchy) {
      if (level === "departamento") ids.push("peru-departamentos-fill");
      else if (level === "provincia") ids.push("peru-provincias-fill");
      else ids.push("peru-distritos-fill");
    }
    if (activeClientLayer) ids.push("client-geojson-fill");
    return ids.length > 0 ? ids : undefined;
  }, [activeClientLayer, enableHierarchy, level]);

  const resolvedHierarchyPoints = hierarchyPoints ?? points ?? [];

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
      onMapMouseDown={handleBoxSelectStart}
      onMapMouseUp={handleBoxSelectEnd}
      onMapClick={handleMapClick}
      onMapHover={handleMapHover}
      onMapHoverLeave={clearHover}
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
      renderPointsAsLayer
      pointLayerId="peru-points"
      frameOverlay={
        boxSelectionRect ? (
          <div
            className="absolute rounded-lg border border-sky-300/80 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
            style={{
              left: boxSelectionRect.x,
              top: boxSelectionRect.y,
              width: boxSelectionRect.width,
              height: boxSelectionRect.height,
            }}
          />
        ) : null
      }
    >
      {enableHierarchy ? (
        <MapHierarchyLayers
          departamentos={departamentos}
          provincias={provincias}
          distritos={distritos}
          points={resolvedHierarchyPoints}
          level={level}
          selectedCodes={selectedCodes}
          hoverCodes={hoveredCodes}
          selectedSector={selectedSector}
          blockedCodes={
            activeClientLayer ? (allowedGeoCodes ?? undefined) : undefined
          }
          fillColor={fillColor}
          lineColor={lineColor}
          fillOpacity={fillOpacity}
          highlightFillColor={highlightFillColor}
          highlightFillOpacity={highlightFillOpacity}
          enableHighlight
        />
      ) : null}
      {activeClientLayer ? (
        <Source
          id="client-geojson"
          type="geojson"
          data={activeClientLayer as unknown as any}
          generateId
        >
          <Layer
            id="client-geojson-fill"
            type="fill"
            filter={clientFillFilter}
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="client-geojson-line"
            type="line"
            filter={clientLineFilter}
            paint={{
              "line-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "rgba(239,68,68,0.95)",
                "rgba(0,0,0,0.9)",
              ],
              "line-width": 2,
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
    if (
      coords.length === 2 &&
      coords.every((value) => typeof value === "number")
    ) {
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
