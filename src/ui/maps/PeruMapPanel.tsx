"use client";

import * as React from "react";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { MapRef } from "@vis.gl/react-maplibre";
import { MapPanel } from "@/ui/maps/MapPanel";
import {
  peruMapStyle,
  defaultMapView,
  mapStyleDark,
  mapStyleLight,
  peruTilesUrl,
  peruTilesVersion,
} from "@/maps/mapConfig";
import { useTheme } from "@/theme/ThemeProvider";
import { MapHierarchyTileLayers } from "@/ui/maps/hierarchy/MapHierarchyTileLayers";
import { MapHierarchyControls } from "@/ui/maps/hierarchy/MapHierarchyControls";
import { useMapHierarchy } from "@/maps/hierarchy/useMapHierarchy";
import { getGeoJson } from "@/maps/hierarchy/geoIndex";
import { isPointInGeometry } from "@/maps/hierarchy/geoSpatial";
import type {
  GeoFeatureCollection,
  GeoLevel,
  MapHierarchySelection,
} from "@/maps/hierarchy/types";
import { Source, Layer } from "@vis.gl/react-maplibre";

type PeruMapPoint = {
  lat: number;
  lng: number;
  id?: string | null;
  clientId?: string | null;
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
  interviewDistrictCodes?: string[];
  highlightPoints?: boolean;
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
  highlightPoint?: { lat: number; lng: number } | null;
  overlayExtra?: React.ReactNode;
  overlayPosition?: "left" | "right";
  showTrackingLabels?: boolean;
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
  priorityGeojsonLayers?: {
    departamento?: GeoFeatureCollection | null;
    provincia?: GeoFeatureCollection | null;
    distrito?: GeoFeatureCollection | null;
  } | null;
  onHierarchyLevelChange?: (level: GeoLevel) => void;
  onHierarchySelectionChange?: (selection: MapHierarchySelection) => void;
  enableBoxSelect?: boolean;
  onBoxSelect?: (
    points: PeruMapPoint[],
    bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }
  ) => void;
};

export const PeruMapPanel = ({
  height,
  className,
  points,
  hierarchyPoints,
  interviewDistrictCodes,
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
  highlightPoints = false,
  focusPoint = null,
  onClearFocusPoint,
  highlightPoint = null,
  overlayExtra,
  overlayPosition = "left",
  showTrackingLabels = true,
  clientGeojson = null,
  clientGeojsonMeta = null,
  clientGeojsonLayers = null,
  priorityGeojsonLayers = null,
  onHierarchyLevelChange,
  onHierarchySelectionChange,
  enableBoxSelect = false,
  onBoxSelect,
}: PeruMapPanelProps) => {
  const { mode } = useTheme();
  const { level, selectedCodes, breadcrumb, canGoBack, actions, index } =
    useMapHierarchy();
  const localMapRef = React.useRef<MapRef | null>(null);
  const resolvedRef = mapRef ?? localMapRef;
  const appliedClientBoundsKeyRef = React.useRef<string | null>(null);
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null);
  const bounds = React.useMemo<[number, number, number, number] | null>(() => {
    if (!index) return null;
    const nodes = Object.values(index.nodes).filter(
      (node) => node.level === "departamento",
    );
    if (nodes.length === 0) return null;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const node of nodes) {
      const [nodeMinLng, nodeMinLat, nodeMaxLng, nodeMaxLat] = node.bbox;
      if (nodeMinLng < minLng) minLng = nodeMinLng;
      if (nodeMinLat < minLat) minLat = nodeMinLat;
      if (nodeMaxLng > maxLng) maxLng = nodeMaxLng;
      if (nodeMaxLat > maxLat) maxLat = nodeMaxLat;
    }
    if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;
    return [minLng, minLat, maxLng, maxLat];
  }, [index]);
  const [mapReady, setMapReady] = React.useState(false);
  const [renderedLevel, setRenderedLevel] = React.useState<GeoLevel>(level);
  const [pendingLevel, setPendingLevel] = React.useState<GeoLevel | null>(null);
  const [hoveredCodes, setHoveredCodes] = React.useState<{
    dep?: string;
    prov?: string;
    dist?: string;
  } | null>(null);
  const [highlightGeojson, setHighlightGeojson] = React.useState<GeoFeatureCollection | null>(null);
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
  const pendingPrefetchRef = React.useRef(0);

  const highlightPointsSource = React.useMemo(() => {
    if (!highlightPoints) return [] as PeruMapPoint[];
    return hierarchyPoints ?? points ?? [];
  }, [highlightPoints, hierarchyPoints, points]);

  React.useEffect(() => {
    if (!highlightPoints) {
      setHighlightGeojson(null);
      return;
    }
    let active = true;
    const url =
      renderedLevel === "departamento"
        ? "/geo/departamentos%202.geojson"
        : renderedLevel === "provincia"
          ? "/geo/provincias.geojson"
          : "/geo/distritos.geojson";
    getGeoJson(url)
      .then((geojson) => {
        if (!active) return;
        setHighlightGeojson(geojson);
      })
      .catch(() => {
        if (!active) return;
        setHighlightGeojson(null);
      });
    return () => {
      active = false;
    };
  }, [highlightPoints, renderedLevel]);

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


  const fillColor =
    mode === "dark" ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)";
  const lineColor = "rgba(24,24,27,0.68)";
  const fillOpacity = useStreetBase ? 0 : mode === "dark" ? 0.24 : 0.2;
  const highlightFillColor =
    level === "distrito" ? "rgba(239,68,68,0.35)" : "rgba(59,130,246,0.22)";
  const highlightFillOpacity = 0.35;
  const clientFillColor = "rgba(59,130,246,0.18)";
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

  const resolveTilesBaseUrl = React.useCallback(() => {
    if (peruTilesUrl.startsWith("http")) return peruTilesUrl;
    if (typeof window === "undefined") return peruTilesUrl;
    return `${window.location.origin}${peruTilesUrl}`;
  }, []);

  const getTileForLngLat = React.useCallback((lng: number, lat: number, zoom: number) => {
    const clampedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878);
    const scale = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * scale);
    const rad = (clampedLat * Math.PI) / 180;
    const y = Math.floor(
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale,
    );
    return { x, y };
  }, []);

  const prefetchTilesForLevel = React.useCallback(
    async (targetLevel: GeoLevel, signal?: AbortSignal) => {
      if (!resolvedRef.current) return false;
      const map = resolvedRef.current;
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      const center = map.getCenter();

      const zoomRanges: Record<GeoLevel, { min: number; max: number }> = {
        departamento: { min: 4, max: 7 },
        provincia: { min: 6, max: 10 },
        distrito: { min: 8, max: 12 },
      };
      const range = zoomRanges[targetLevel];
      const clampedZoom = Math.min(range.max, Math.max(range.min, Math.round(zoom)));

      const baseUrl = resolveTilesBaseUrl();
      const layerParam =
        targetLevel === "departamento"
          ? "departamentos"
          : targetLevel === "provincia"
            ? "provincias"
            : "distritos";

      const tile = getTileForLngLat(center.lng, center.lat, clampedZoom);
      const candidates = [
        tile,
        { x: tile.x + 1, y: tile.y },
        { x: tile.x - 1, y: tile.y },
        { x: tile.x, y: tile.y + 1 },
        { x: tile.x, y: tile.y - 1 },
      ];

      const minTile = getTileForLngLat(bounds.getWest(), bounds.getNorth(), clampedZoom);
      const maxTile = getTileForLngLat(bounds.getEast(), bounds.getSouth(), clampedZoom);

      const tiles = candidates.filter((candidate) => {
        const minX = Math.min(minTile.x, maxTile.x);
        const maxX = Math.max(minTile.x, maxTile.x);
        const minY = Math.min(minTile.y, maxTile.y);
        const maxY = Math.max(minTile.y, maxTile.y);
        return (
          candidate.x >= minX &&
          candidate.x <= maxX &&
          candidate.y >= minY &&
          candidate.y <= maxY
        );
      });

      const uniqueTiles = Array.from(
        new Map(tiles.map((item) => [`${item.x}-${item.y}`, item])).values(),
      );

      const responses = await Promise.allSettled(
        uniqueTiles.map((item) =>
          fetch(
            `${baseUrl
              .replace("{z}", String(clampedZoom))
              .replace("{x}", String(item.x))
              .replace("{y}", String(item.y))}?layer=${layerParam}&v=${peruTilesVersion}`,
            { signal },
          ),
        ),
      );

      return responses.some(
        (result) =>
          result.status === "fulfilled" &&
          (result.value.status === 200 || result.value.status === 204),
      );
    },
    [getTileForLngLat, resolveTilesBaseUrl, resolvedRef],
  );

  React.useEffect(() => {
    if (!mapReady) return;
    if (level === renderedLevel) {
      setPendingLevel(null);
      return;
    }
    const requestId = pendingPrefetchRef.current + 1;
    pendingPrefetchRef.current = requestId;
    setPendingLevel(level);
    const controller = new AbortController();
    const run = async () => {
      await Promise.race([
        prefetchTilesForLevel(level, controller.signal),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 4000)),
      ]);
      if (pendingPrefetchRef.current !== requestId) return;
      setRenderedLevel(level);
      setPendingLevel(null);
    };
    run();
    return () => {
      controller.abort();
    };
  }, [level, mapReady, prefetchTilesForLevel, renderedLevel]);

  React.useEffect(() => {
    if (!mapReady) return;
    const nextLevel =
      renderedLevel === "departamento"
        ? "provincia"
        : renderedLevel === "provincia"
          ? "distrito"
          : null;
    if (!nextLevel) return;
    const controller = new AbortController();
    const runPrefetch = () => {
      void prefetchTilesForLevel(nextLevel, controller.signal);
    };
    const runtime = globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (runtime.requestIdleCallback) {
      const id = runtime.requestIdleCallback(runPrefetch, { timeout: 2000 });
      return () => {
        runtime.cancelIdleCallback?.(id);
        controller.abort();
      };
    }
    const timeout = setTimeout(runPrefetch, 600);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [mapReady, prefetchTilesForLevel, renderedLevel]);


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

  const selectionNode = React.useMemo(() => {
    if (!index) return null;
    if (selectedCodes.dist) {
      const id = index.byCode.distrito[selectedCodes.dist];
      return id ? index.nodes[id] : null;
    }
    if (selectedCodes.dep && selectedCodes.prov) {
      const id = index.byCode.provincia[`${selectedCodes.dep}${selectedCodes.prov}`];
      return id ? index.nodes[id] : null;
    }
    if (selectedCodes.dep) {
      const id = index.byCode.departamento[selectedCodes.dep];
      return id ? index.nodes[id] : null;
    }
    return null;
  }, [index, selectedCodes.dep, selectedCodes.dist, selectedCodes.prov]);

  const hierarchyPointsForCount = hierarchyPoints ?? points ?? [];

  const selectionPointCount = React.useMemo<number | undefined>(() => {
    if (!hierarchyPointsForCount || hierarchyPointsForCount.length === 0) return 0;
    const hasSelection = Boolean(
      selectedCodes.dep || selectedCodes.prov || selectedCodes.dist,
    );
    return hasSelection ? undefined : hierarchyPointsForCount.length;
  }, [
    hierarchyPointsForCount,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
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

  const activePriorityLayer = React.useMemo(() => {
    if (!priorityGeojsonLayers) return null;
    if (level === "departamento") return priorityGeojsonLayers.departamento ?? null;
    if (level === "provincia") return priorityGeojsonLayers.provincia ?? null;
    return priorityGeojsonLayers.distrito ?? null;
  }, [level, priorityGeojsonLayers]);

  const clickableCodes = React.useMemo(() => {
    if (!allowedGeoCodes) return null;
    return {
      deps: allowedGeoCodes.deps ?? null,
      provs: allowedGeoCodes.provs ?? null,
      dists: allowedGeoCodes.dists ?? null,
    };
  }, [allowedGeoCodes]);

  const highlightCodes = React.useMemo(() => {
    if (!highlightPoints || !highlightGeojson || highlightPointsSource.length === 0) {
      return { deps: [], provs: [], dists: [] };
    }
    const result = {
      deps: new Set<string>(),
      provs: new Set<string>(),
      dists: new Set<string>(),
    };

    const normalizedPoints = highlightPointsSource
      .filter((point) => point && Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .map((point) => ({
        lat: point.lat as number,
        lng: point.lng as number,
      }));
    if (normalizedPoints.length === 0) {
      return { deps: [], provs: [], dists: [] };
    }

    const normalize = (value: string, length: number) => {
      const digits = value.replace(/\D/g, "");
      if (!digits) return value;
      return digits.padStart(length, "0");
    };

    const stripLeadingZeros = (value: string) => value.replace(/^0+/, "") || value;

    for (const feature of highlightGeojson.features) {
      const geometry = feature.geometry;
      if (!geometry) continue;
      const geometryBounds = getGeometryBounds(geometry);
      let hasPoint = false;
      for (const point of normalizedPoints) {
        if (geometryBounds && !isPointInBounds(geometryBounds, point)) continue;
        if (isPointInGeometry(geometry, { lat: point.lat, lng: point.lng })) {
          hasPoint = true;
          break;
        }
      }
      if (!hasPoint) continue;
      const props = feature.properties ?? {};
      if (renderedLevel === "departamento") {
        const raw = String((props as any).CODDEP ?? "");
        const padded = normalize(raw, 2);
        if (raw) result.deps.add(raw);
        if (padded) result.deps.add(padded);
        result.deps.add(stripLeadingZeros(raw));
        result.deps.add(stripLeadingZeros(padded));
      }
      if (renderedLevel === "provincia") {
        const depRaw = String((props as any).CODDEP ?? "");
        const provRaw = String((props as any).CODPROV ?? "");
        const depPad = normalize(depRaw, 2);
        const provPad = normalize(provRaw, 2);
        const combos = [
          `${depRaw}${provRaw}`,
          `${depPad}${provPad}`,
          `${stripLeadingZeros(depRaw)}${stripLeadingZeros(provRaw)}`,
          `${stripLeadingZeros(depPad)}${stripLeadingZeros(provPad)}`,
        ];
        for (const combo of combos) {
          if (combo) result.provs.add(combo);
        }
      }
      if (renderedLevel === "distrito") {
        const raw = String((props as any).UBIGEO ?? "");
        const padded = normalize(raw, 6);
        if (raw) result.dists.add(raw);
        if (padded) result.dists.add(padded);
        result.dists.add(stripLeadingZeros(raw));
        result.dists.add(stripLeadingZeros(padded));
      }
    }
    return {
      deps: Array.from(result.deps),
      provs: Array.from(result.provs),
      dists: Array.from(result.dists),
    };
  }, [highlightGeojson, highlightPoints, highlightPointsSource, renderedLevel]);

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

  const priorityLayerFilter = React.useMemo(() => clientLayerFilter, [clientLayerFilter]);

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

  const priorityFillFilter = React.useMemo(() => {
    const geometryFilter = [
      "match",
      ["geometry-type"],
      ["Polygon", "MultiPolygon"],
      true,
      false,
    ] as any;
    if (!priorityLayerFilter) return geometryFilter;
    return ["all", priorityLayerFilter, geometryFilter] as any;
  }, [priorityLayerFilter]);

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

  const priorityLineFilter = React.useMemo(() => {
    const geometryFilter = [
      "match",
      ["geometry-type"],
      ["LineString", "MultiLineString", "Polygon", "MultiPolygon"],
      true,
      false,
    ] as any;
    if (!priorityLayerFilter) return geometryFilter;
    return ["all", priorityLayerFilter, geometryFilter] as any;
  }, [priorityLayerFilter]);

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
    if (!mapReady || !resolvedRef.current || !index) return;
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
        ? index.byCode.departamento[depCode]
        : undefined;
      const depNode = depId ? index.nodes[depId] : undefined;
      if (depNode) selection.depName = depNode.name;

      if (depCode && provCode) {
        const provId = index.byCode.provincia[`${depCode}${provCode}`];
        const provNode = provId ? index.nodes[provId] : undefined;
        if (provNode) selection.provName = provNode.name;
        if (!selection.depName && provNode?.parentId) {
          selection.depName = index.nodes[provNode.parentId]?.name;
        }
      }

      if (distCode) {
        const distId = index.byCode.distrito[distCode];
        const distNode = distId ? index.nodes[distId] : undefined;
        if (distNode) selection.distName = distNode.name;
        if (distNode?.parentId) {
          const provNode = index.nodes[distNode.parentId];
          if (provNode && !selection.provName) selection.provName = provNode.name;
          if (provNode?.parentId && !selection.depName) {
            selection.depName = index.nodes[provNode.parentId]?.name;
          }
        }
      }

      if (typeof selectionPointCount === "number") {
        selection.pointCount = selectionPointCount;
      }
      onHierarchySelectionChange(selection);
    }

    if (!selectionNode) return;
    resolvedRef.current?.fitBounds(
      [
        [selectionNode.bbox[0], selectionNode.bbox[1]],
        [selectionNode.bbox[2], selectionNode.bbox[3]],
      ],
      { padding: 24, duration: 650 },
    );
  }, [
    index,
    level,
    mapReady,
    onHierarchySelectionChange,
    resolvedRef,
    selectedCodes.dep,
    selectedCodes.dist,
    selectedCodes.prov,
    selectionNode,
    selectionPointCount,
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

  const fitSelectionBounds = React.useCallback(() => {
    if (!selectionNode || !resolvedRef.current) return;
    resolvedRef.current.fitBounds(
      [
        [selectionNode.bbox[0], selectionNode.bbox[1]],
        [selectionNode.bbox[2], selectionNode.bbox[3]],
      ],
      { padding: 24, duration: 650 },
    );
  }, [resolvedRef, selectionNode]);

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (pendingLevel) return;
      if (!enableHierarchy && !activeClientLayer) return;
      if (focusPoint) {
        onClearFocusPoint?.();
      }
      const priorityFeature = activePriorityLayer
        ? event.features?.find((item) => item.layer?.id === "priority-geojson-fill")
        : undefined;
      if (priorityFeature?.geometry) {
        const bounds = getGeoJsonBounds({
          features: [priorityFeature as { geometry: { coordinates: unknown } }],
        });
        resolvedRef.current?.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 24, duration: 650 },
        );
        if (!enableHierarchy) return;
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
          fitSelectionBounds();
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
            fitSelectionBounds();
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
      enableHierarchy,
      focusPoint,
      fitSelectionBounds,
      level,
      onClearFocusPoint,
      pendingLevel,
      resolvedRef,
      resetView,
      selectedSector,
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
      if (pendingLevel) return;
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
      if (renderedLevel === "departamento") {
        const dep = props.CODDEP ? String(props.CODDEP) : "";
        const isAllowed = clickableCodes?.deps ? clickableCodes.deps.includes(dep) : true;
        if (!dep || !isAllowed) {
          clearHover();
          return;
        }
        setHoveredCodes({ dep });
      } else if (renderedLevel === "provincia") {
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
      } else if (renderedLevel === "distrito") {
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
      activePriorityLayer,
      clearHover,
      clickableCodes,
      enableBoxSelect,
      enableHierarchy,
      isSectorLayerActive,
      pendingLevel,
      renderedLevel,
      resolvedRef,
      updateBoxSelection,
    ],
  );

  const interactiveLayerIds = React.useMemo(() => {
    const ids: string[] = [];
    if (enableHierarchy) {
      if (renderedLevel === "departamento") ids.push("peru-departamentos-fill");
      else if (renderedLevel === "provincia") ids.push("peru-provincias-fill");
      else ids.push("peru-distritos-fill");
    }
    if (activeClientLayer) ids.push("client-geojson-fill");
    if (activePriorityLayer) ids.push("priority-geojson-fill");
    return ids.length > 0 ? ids : undefined;
  }, [activeClientLayer, activePriorityLayer, enableHierarchy, renderedLevel]);

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
          <div
            className={`flex flex-col gap-2 ${
              overlayPosition === "right" ? "items-end" : "items-start"
            }`}
          >
            {overlayExtra}
            <MapHierarchyControls
              breadcrumb={breadcrumb}
              canGoBack={canGoBack}
              onBack={handleBack}
              onReset={handleReset}
            />
          </div>
        ) : (
          overlayExtra ?? null
        )
      }
      overlayPosition={overlayPosition}
      mapRef={resolvedRef}
      highlightPoint={highlightPoint}
      getPointColor={getPointColor}
      enablePointTooltip={enablePointTooltip}
      showTrackingLabels={showTrackingLabels}
      renderPointTooltip={renderPointTooltip}
      renderPointsAsLayer
      pointLayerId="peru-points"
       frameOverlay={
         boxSelectionRect || pendingLevel ? (
           <>
             {boxSelectionRect ? (
               <div
                 className="absolute rounded-lg border border-sky-300/80 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                 style={{
                   left: boxSelectionRect.x,
                   top: boxSelectionRect.y,
                   width: boxSelectionRect.width,
                   height: boxSelectionRect.height,
                 }}
               />
             ) : null}
             {pendingLevel ? (
               <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-50 shadow-sm backdrop-blur">
                 Cargando nivel
               </div>
             ) : null}
           </>
         ) : null
       }
    >
      {enableHierarchy ? (
        <MapHierarchyTileLayers
          level={renderedLevel}
          selectedCodes={selectedCodes}
          hoverCodes={hoveredCodes}
          selectedSector={selectedSector}
          highlightDepartmentCodes={highlightPoints ? highlightCodes.deps : undefined}
          highlightProvinceCodes={highlightPoints ? highlightCodes.provs : undefined}
          highlightDistrictCodes={highlightPoints ? highlightCodes.dists : interviewDistrictCodes}
          fillColor={fillColor}
          lineColor={lineColor}
          fillOpacity={fillOpacity}
          highlightFillColor={highlightFillColor}
          highlightFillOpacity={highlightFillOpacity}
          enableHighlight={!pendingLevel}
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
              "fill-color": clientFillColor,
              "fill-opacity": highlightFillOpacity,
              "fill-antialias": true,
              "fill-opacity-transition": { duration: 220, delay: 0 },
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
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
        </Source>
      ) : null}
      {activePriorityLayer ? (
        <Source
          id="priority-geojson"
          type="geojson"
          data={activePriorityLayer as unknown as any}
          generateId
        >
          <Layer
            id="priority-geojson-fill"
            type="fill"
            filter={priorityFillFilter}
            paint={{
              "fill-color": "rgba(239,68,68,0.3)",
              "fill-opacity": 0.35,
              "fill-antialias": true,
            }}
          />
          <Layer
            id="priority-geojson-line"
            type="line"
            filter={priorityLineFilter}
            paint={{
              "line-color": "rgba(239,68,68,0.9)",
              "line-width": 2,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
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

const geometryBoundsCache = new WeakMap<object, [number, number, number, number]>();

const getGeometryBounds = (geometry: { coordinates: unknown }) => {
  const cached = geometryBoundsCache.get(geometry as object);
  if (cached) return cached;
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

  walkCoordinates(geometry.coordinates);
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;
  const bounds: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
  geometryBoundsCache.set(geometry as object, bounds);
  return bounds;
};

const isPointInBounds = (
  bounds: [number, number, number, number],
  point: { lat: number; lng: number },
) => {
  return (
    point.lng >= bounds[0] &&
    point.lng <= bounds[2] &&
    point.lat >= bounds[1] &&
    point.lat <= bounds[3]
  );
};
