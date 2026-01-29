import * as React from "react";
import { Layer, Source } from "@vis.gl/react-maplibre";
import type { GeoFeatureCollection, GeoLevel } from "./types";
import { findFeatureByPoint } from "./geoSpatial";

type MapHierarchyLayersProps = {
  departamentos: GeoFeatureCollection | null;
  provincias: GeoFeatureCollection | null;
  distritos: GeoFeatureCollection | null;
  level: GeoLevel;
  points?: Array<{ lat: number; lng: number }>;
  selectedCodes: {
    dep?: string;
    prov?: string;
    dist?: string;
  };
  hoverCodes?: {
    dep?: string;
    prov?: string;
    dist?: string;
  } | null;
  blockedCodes?: {
    deps?: string[] | null;
    provs?: Array<{ dep: string; prov: string }> | null;
    dists?: string[] | null;
  } | null;
  fillColor: string;
  lineColor: string;
  fillOpacity: number;
  highlightFillColor: string;
  highlightFillOpacity: number;
  hoverLineColor?: string;
  hoverLineWidth?: number;
  enableHighlight?: boolean;
  highlightOpacity?: number;
};

export const MapHierarchyLayers = ({
  departamentos,
  provincias,
  distritos,
  level,
  points = [],
  selectedCodes,
  hoverCodes = null,
  blockedCodes = null,
  fillColor,
  lineColor,
  fillOpacity,
  highlightFillColor,
  highlightFillOpacity,
  hoverLineColor = "rgba(239,68,68,0.95)",
  hoverLineWidth = 3.2,
  enableHighlight = true,
  highlightOpacity = 0.5,
}: MapHierarchyLayersProps) => {
  const showDepartamentos = level === "departamento";
  const showProvincias = level === "provincia";
  const showDistritos = level === "distrito";

  const provinciaFilter = React.useMemo(() => {
    if (!selectedCodes.dep) return ["==", ["get", "CODDEP"], ""] as any;
    return ["==", ["get", "CODDEP"], selectedCodes.dep] as any;
  }, [selectedCodes.dep]);

  const distritoFilter = React.useMemo(() => {
    if (!selectedCodes.dep || !selectedCodes.prov) {
      return ["==", ["get", "CODDEP"], ""] as any;
    }
    return [
      "all",
      ["==", ["get", "CODDEP"], selectedCodes.dep],
      ["==", ["get", "CODPROV"], selectedCodes.prov],
    ] as any;
  }, [selectedCodes.dep, selectedCodes.prov]);

  const highlightCodes = React.useMemo(() => {
    const deptCodes = new Set<string>();
    const provPairs = new Map<string, { dep: string; prov: string }>();
    const distPairs = new Map<string, { dep: string; prov: string; dist: string }>();

    if (points.length === 0) {
      return { deptCodes: [], provPairs: [], distPairs: [] };
    }

    if (level === "departamento" && departamentos) {
      for (const point of points) {
        const match = findFeatureByPoint(departamentos, point);
        const dep = match?.properties?.CODDEP ? String(match.properties.CODDEP) : null;
        if (dep) deptCodes.add(dep);
      }
    }

    if (level === "provincia" && provincias) {
      for (const point of points) {
        const match = findFeatureByPoint(provincias, point);
        const dep = match?.properties?.CODDEP ? String(match.properties.CODDEP) : null;
        const prov = match?.properties?.CODPROV ? String(match.properties.CODPROV) : null;
        if (dep && prov) {
          provPairs.set(`${dep}-${prov}`, { dep, prov });
        }
      }
    }

    if (level === "distrito" && distritos) {
      for (const point of points) {
        const match = findFeatureByPoint(distritos, point);
        const dep = match?.properties?.CODDEP ? String(match.properties.CODDEP) : null;
        const prov = match?.properties?.CODPROV ? String(match.properties.CODPROV) : null;
        const dist = match?.properties?.UBIGEO ? String(match.properties.UBIGEO) : null;
        if (dep && prov && dist) {
          distPairs.set(`${dep}-${prov}-${dist}`, { dep, prov, dist });
        }
      }
    }

    return {
      deptCodes: Array.from(deptCodes),
      provPairs: Array.from(provPairs.values()),
      distPairs: Array.from(distPairs.values()),
    };
  }, [departamentos, distritos, level, points, provincias]);

  const filteredHighlightCodes = React.useMemo(() => {
    const blockedDeps = new Set(blockedCodes?.deps ?? []);
    const blockedProvs = new Set(
      (blockedCodes?.provs ?? []).map((item) => `${item.dep}-${item.prov}`),
    );
    const blockedDists = new Set(blockedCodes?.dists ?? []);

    return {
      deptCodes: highlightCodes.deptCodes.filter((code) => !blockedDeps.has(code)),
      provPairs: highlightCodes.provPairs.filter(
        (item) => !blockedProvs.has(`${item.dep}-${item.prov}`),
      ),
      distPairs: highlightCodes.distPairs.filter((item) => !blockedDists.has(item.dist)),
    };
  }, [blockedCodes?.deps, blockedCodes?.dists, blockedCodes?.provs, highlightCodes]);

  const departamentoHighlightFilter = React.useMemo(() => {
    if (filteredHighlightCodes.deptCodes.length === 0) return ["==", ["get", "CODDEP"], ""] as any;
    if (selectedCodes.dep) {
      return filteredHighlightCodes.deptCodes.includes(selectedCodes.dep)
        ? (["==", ["get", "CODDEP"], selectedCodes.dep] as any)
        : (["==", ["get", "CODDEP"], ""] as any);
    }
    return ["in", ["get", "CODDEP"], ["literal", filteredHighlightCodes.deptCodes]] as any;
  }, [filteredHighlightCodes.deptCodes, selectedCodes.dep]);

  const provinciaHighlightFilter = React.useMemo(() => {
    if (!selectedCodes.dep) return ["==", ["get", "CODDEP"], ""] as any;
    if (filteredHighlightCodes.provPairs.length === 0) return ["==", ["get", "CODDEP"], ""] as any;
    const provCodes = filteredHighlightCodes.provPairs
      .filter((item) => item.dep === selectedCodes.dep)
      .map((item) => item.prov);
    if (provCodes.length === 0) return ["==", ["get", "CODDEP"], ""] as any;
    return [
      "all",
      ["==", ["get", "CODDEP"], selectedCodes.dep],
      ["in", ["get", "CODPROV"], ["literal", provCodes]],
    ] as any;
  }, [filteredHighlightCodes.provPairs, selectedCodes.dep]);

  const distritoHighlightFilter = React.useMemo(() => {
    if (!selectedCodes.dep || !selectedCodes.prov) return ["==", ["get", "CODDEP"], ""] as any;
    if (filteredHighlightCodes.distPairs.length === 0) return ["==", ["get", "CODDEP"], ""] as any;
    const distCodes = filteredHighlightCodes.distPairs
      .filter((item) => item.dep === selectedCodes.dep && item.prov === selectedCodes.prov)
      .map((item) => item.dist);
    if (distCodes.length === 0) return ["==", ["get", "CODDEP"], ""] as any;
    return [
      "all",
      ["==", ["get", "CODDEP"], selectedCodes.dep],
      ["==", ["get", "CODPROV"], selectedCodes.prov],
      ["in", ["get", "UBIGEO"], ["literal", distCodes]],
    ] as any;
  }, [filteredHighlightCodes.distPairs, selectedCodes.dep, selectedCodes.prov]);

  const departamentoHoverFilter = React.useMemo(() => {
    if (!hoverCodes?.dep) return ["==", ["get", "CODDEP"], ""] as any;
    return ["==", ["get", "CODDEP"], hoverCodes.dep] as any;
  }, [hoverCodes?.dep]);

  const provinciaHoverFilter = React.useMemo(() => {
    if (!hoverCodes?.dep || !hoverCodes?.prov) return ["==", ["get", "CODDEP"], ""] as any;
    return [
      "all",
      ["==", ["get", "CODDEP"], hoverCodes.dep],
      ["==", ["get", "CODPROV"], hoverCodes.prov],
    ] as any;
  }, [hoverCodes?.dep, hoverCodes?.prov]);

  const distritoHoverFilter = React.useMemo(() => {
    if (!hoverCodes?.dist) return ["==", ["get", "UBIGEO"], ""] as any;
    return ["==", ["get", "UBIGEO"], hoverCodes.dist] as any;
  }, [hoverCodes?.dist]);

  return (
    <>
      {departamentos ? (
        <Source id="peru-departamentos" type="geojson" data={departamentos as unknown as any}>
          <Layer
            id="peru-departamentos-fill"
            type="fill"
            layout={{ visibility: showDepartamentos ? "visible" : "none" }}
            filter={
              selectedCodes.dep
                ? (["==", ["get", "CODDEP"], selectedCodes.dep] as any)
                : (["all"] as any)
            }
            paint={{
              "fill-color": fillColor,
              "fill-opacity": fillOpacity,
            }}
          />
          <Layer
            id="peru-departamentos-highlight"
            type="fill"
            layout={{ visibility: showDepartamentos && enableHighlight ? "visible" : "none" }}
            filter={departamentoHighlightFilter}
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-departamentos-line"
            type="line"
            layout={{ visibility: showDepartamentos ? "visible" : "none" }}
            filter={
              selectedCodes.dep
                ? (["==", ["get", "CODDEP"], selectedCodes.dep] as any)
                : showDepartamentos
                  ? (["all"] as any)
                  : (["==", ["get", "CODDEP"], ""] as any)
            }
            paint={{
              "line-color": lineColor,
              "line-width": 2,
              "line-opacity": 1,
            }}
          />
          {selectedCodes.dep ? (
            <Layer
              id="peru-departamentos-selected"
              type="line"
              layout={{ visibility: showDepartamentos ? "visible" : "none" }}
              filter={["==", ["get", "CODDEP"], selectedCodes.dep] as any}
              paint={{
                "line-color": lineColor,
                "line-width": 2.8,
                "line-opacity": 1,
              }}
            />
          ) : null}
          {hoverCodes?.dep ? (
            <Layer
              id="peru-departamentos-hover"
              type="line"
              layout={{ visibility: showDepartamentos ? "visible" : "none" }}
              filter={departamentoHoverFilter}
              paint={{
                "line-color": hoverLineColor,
                "line-width": hoverLineWidth,
                "line-opacity": 1,
              }}
            />
          ) : null}
        </Source>
      ) : null}

      {provincias ? (
        <Source id="peru-provincias" type="geojson" data={provincias as unknown as any}>
          <Layer
            id="peru-provincias-fill"
            type="fill"
            layout={{ visibility: level === "provincia" ? "visible" : "none" }}
            filter={provinciaFilter}
            paint={{
              "fill-color": "rgba(16,185,129,0.18)",
              "fill-opacity": fillOpacity,
            }}
          />
          <Layer
            id="peru-provincias-highlight"
            type="fill"
            layout={{ visibility: level === "provincia" && enableHighlight ? "visible" : "none" }}
            filter={provinciaHighlightFilter}
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-provincias-line"
            type="line"
            layout={{ visibility: showProvincias ? "visible" : "none" }}
            filter={
              selectedCodes.prov
                ? ([
                    "all",
                    ["==", ["get", "CODDEP"], selectedCodes.dep ?? ""],
                    ["==", ["get", "CODPROV"], selectedCodes.prov],
                  ] as any)
                : provinciaFilter
            }
            paint={{
              "line-color": lineColor,
              "line-width": 1.4,
              "line-opacity": 1,
            }}
          />
          {selectedCodes.prov ? (
            <Layer
              id="peru-provincias-selected"
              type="line"
              layout={{ visibility: level === "provincia" ? "visible" : "none" }}
              filter={[
                "all",
                ["==", ["get", "CODDEP"], selectedCodes.dep ?? ""],
                ["==", ["get", "CODPROV"], selectedCodes.prov],
              ] as any}
              paint={{
                "line-color": lineColor,
                "line-width": 2.4,
                "line-opacity": 1,
              }}
            />
          ) : null}
          {hoverCodes?.prov ? (
            <Layer
              id="peru-provincias-hover"
              type="line"
              layout={{ visibility: showProvincias ? "visible" : "none" }}
              filter={provinciaHoverFilter}
              paint={{
                "line-color": hoverLineColor,
                "line-width": hoverLineWidth,
                "line-opacity": 1,
              }}
            />
          ) : null}
        </Source>
      ) : null}

      {distritos ? (
        <Source id="peru-distritos" type="geojson" data={distritos as unknown as any}>
          <Layer
            id="peru-distritos-fill"
            type="fill"
            layout={{ visibility: showDistritos ? "visible" : "none" }}
            filter={
              selectedCodes.dist
                ? (["==", ["get", "UBIGEO"], selectedCodes.dist] as any)
                : distritoFilter
            }
            paint={{
              "fill-color": "rgba(248,113,113,0.22)",
              "fill-opacity": fillOpacity,
            }}
          />
          <Layer
            id="peru-distritos-highlight"
            type="fill"
            layout={{ visibility: showDistritos && enableHighlight ? "visible" : "none" }}
            filter={distritoHighlightFilter}
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-distritos-line"
            type="line"
            layout={{ visibility: showDistritos ? "visible" : "none" }}
            filter={
              selectedCodes.dist
                ? (["==", ["get", "UBIGEO"], selectedCodes.dist] as any)
                : distritoFilter
            }
            paint={{
              "line-color": lineColor,
              "line-width": 1.2,
              "line-opacity": 1,
            }}
          />
          {selectedCodes.dist ? (
            <Layer
              id="peru-distritos-selected"
              type="line"
              layout={{ visibility: showDistritos ? "visible" : "none" }}
              filter={["==", ["get", "UBIGEO"], selectedCodes.dist] as any}
              paint={{
                "line-color": lineColor,
                "line-width": 2.4,
                "line-opacity": 1,
              }}
            />
          ) : null}
          {hoverCodes?.dist ? (
            <Layer
              id="peru-distritos-hover"
              type="line"
              layout={{ visibility: showDistritos ? "visible" : "none" }}
              filter={distritoHoverFilter}
              paint={{
                "line-color": hoverLineColor,
                "line-width": hoverLineWidth,
                "line-opacity": 1,
              }}
            />
          ) : null}
        </Source>
      ) : null}
    </>
  );
};
