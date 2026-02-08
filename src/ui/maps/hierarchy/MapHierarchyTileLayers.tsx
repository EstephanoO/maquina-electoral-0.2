"use client";

import * as React from "react";
import { Layer, Source } from "@vis.gl/react-maplibre";
import type { GeoLevel } from "@/maps/hierarchy/types";
import { peruTilesUrl, peruTilesVersion } from "@/maps/mapConfig";

type MapHierarchyTileLayersProps = {
  level: GeoLevel;
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
  selectedSector?: string | null;
  highlightDepartmentCodes?: string[];
  highlightProvinceCodes?: string[];
  highlightDistrictCodes?: string[];
  fillColor: string;
  lineColor: string;
  fillOpacity: number;
  highlightFillColor: string;
  highlightFillOpacity: number;
  hoverLineColor?: string;
  hoverLineWidth?: number;
  enableHighlight?: boolean;
};

export const MapHierarchyTileLayers = ({
  level,
  selectedCodes,
  hoverCodes = null,
  selectedSector = null,
  highlightDepartmentCodes,
  highlightProvinceCodes,
  highlightDistrictCodes,
  fillColor,
  lineColor,
  fillOpacity,
  highlightFillColor,
  highlightFillOpacity,
  hoverLineColor = "rgba(239,68,68,0.95)",
  hoverLineWidth = 3.2,
  enableHighlight = true,
}: MapHierarchyTileLayersProps) => {
  const resolvedTilesUrl = React.useMemo(() => {
    if (peruTilesUrl.startsWith("http")) return peruTilesUrl;
    if (typeof window === "undefined") return peruTilesUrl;
    return `${window.location.origin}${peruTilesUrl}`;
  }, []);
  const departamentosTilesUrl = React.useMemo(
    () => `${resolvedTilesUrl}?layer=departamentos&v=${peruTilesVersion}`,
    [resolvedTilesUrl],
  );
  const provinciasTilesUrl = React.useMemo(
    () => `${resolvedTilesUrl}?layer=provincias&v=${peruTilesVersion}`,
    [resolvedTilesUrl],
  );
  const distritosTilesUrl = React.useMemo(
    () => `${resolvedTilesUrl}?layer=distritos&v=${peruTilesVersion}`,
    [resolvedTilesUrl],
  );
  const showDepartamentos = level === "departamento";
  const showProvincias = level === "provincia";
  const showDistritos = level === "distrito" && !selectedSector;
  const departmentsWithPointsFilter = React.useMemo(() => {
    if (!highlightDepartmentCodes) return null;
    if (highlightDepartmentCodes.length === 0) {
      return ["==", ["get", "CODDEP"], ""] as any;
    }
    return ["in", ["get", "CODDEP"], ["literal", highlightDepartmentCodes]] as any;
  }, [highlightDepartmentCodes]);

  const provincesWithPointsFilter = React.useMemo(() => {
    if (!highlightProvinceCodes) return null;
    if (highlightProvinceCodes.length === 0) {
      return ["==", ["get", "CODPROV"], ""] as any;
    }
    return [
      "in",
      ["concat", ["get", "CODDEP"], ["get", "CODPROV"]],
      ["literal", highlightProvinceCodes],
    ] as any;
  }, [highlightProvinceCodes]);
  const districtsWithPointsFilter = React.useMemo(() => {
    if (!highlightDistrictCodes) return null;
    if (highlightDistrictCodes.length === 0) {
      return ["==", ["get", "UBIGEO"], ""] as any;
    }
    return ["in", ["get", "UBIGEO"], ["literal", highlightDistrictCodes]] as any;
  }, [highlightDistrictCodes]);

  const departamentoFilter = React.useMemo(() => {
    if (!selectedCodes.dep) return ["all"] as any;
    return ["==", ["get", "CODDEP"], selectedCodes.dep] as any;
  }, [selectedCodes.dep]);

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
      {showDepartamentos ? (
        <Source
          id="peru-admin-departamentos"
          type="vector"
          tiles={[departamentosTilesUrl]}
          minzoom={0}
          maxzoom={10}
        >
      <Layer
        id="peru-departamentos-fill"
        type="fill"
        source-layer="departamentos"
        layout={{ visibility: showDepartamentos ? "visible" : "none" }}
        filter={departamentoFilter}
        paint={{
          "fill-color": fillColor,
          "fill-opacity": fillOpacity,
        }}
      />
      {departmentsWithPointsFilter ? (
        <Layer
          id="peru-departamentos-points"
          type="fill"
          source-layer="departamentos"
          layout={{ visibility: showDepartamentos ? "visible" : "none" }}
          filter={
            departmentsWithPointsFilter
              ? (["all", departamentoFilter, departmentsWithPointsFilter] as any)
              : (departamentoFilter as any)
          }
          paint={{
            "fill-color": "rgba(248,113,113,0.35)",
            "fill-opacity": highlightFillOpacity,
          }}
        />
      ) : null}
      <Layer
        id="peru-departamentos-highlight"
        type="fill"
        source-layer="departamentos"
        layout={{ visibility: showDepartamentos && enableHighlight && selectedCodes.dep ? "visible" : "none" }}
        filter={departamentoFilter}
        paint={{
          "fill-color": highlightFillColor,
          "fill-opacity": highlightFillOpacity,
        }}
      />
      <Layer
        id="peru-departamentos-line"
        type="line"
        source-layer="departamentos"
        layout={{
          visibility: showDepartamentos ? "visible" : "none",
          "line-join": "round",
          "line-cap": "round",
        }}
        filter={departamentoFilter}
        paint={{
          "line-color": lineColor,
          "line-width": 2,
          "line-opacity": 1,
        }}
      />
      {hoverCodes?.dep ? (
        <Layer
          id="peru-departamentos-hover"
          type="line"
          source-layer="departamentos"
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

      {showProvincias ? (
        <Source
          id="peru-admin-provincias"
          type="vector"
          tiles={[provinciasTilesUrl]}
          minzoom={6}
          maxzoom={12}
        >
          <Layer
            id="peru-provincias-fill"
            type="fill"
            source-layer="provincias"
            layout={{ visibility: "visible" }}
            filter={provinciaFilter}
            paint={{
              "fill-color": "rgba(16,185,129,0.18)",
              "fill-opacity": fillOpacity,
            }}
          />
          {provincesWithPointsFilter ? (
            <Layer
              id="peru-provincias-points"
              type="fill"
              source-layer="provincias"
              layout={{ visibility: "visible" }}
              filter={
                provincesWithPointsFilter
                  ? (["all", provinciaFilter, provincesWithPointsFilter] as any)
                  : (provinciaFilter as any)
              }
              paint={{
                "fill-color": "rgba(248,113,113,0.35)",
                "fill-opacity": highlightFillOpacity,
              }}
            />
          ) : null}
          <Layer
            id="peru-provincias-highlight"
            type="fill"
            source-layer="provincias"
            layout={{
              visibility:
                enableHighlight && selectedCodes.dep && selectedCodes.prov
                  ? "visible"
                  : "none",
            }}
            filter={
              selectedCodes.dep && selectedCodes.prov
                ? ([
                    "all",
                    ["==", ["get", "CODDEP"], selectedCodes.dep],
                    ["==", ["get", "CODPROV"], selectedCodes.prov],
                  ] as any)
                : (["==", ["get", "CODDEP"], ""] as any)
            }
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-provincias-line"
            type="line"
            source-layer="provincias"
            layout={{ visibility: "visible", "line-join": "round", "line-cap": "round" }}
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
          {hoverCodes?.prov ? (
            <Layer
              id="peru-provincias-hover"
              type="line"
              source-layer="provincias"
              layout={{ visibility: "visible" }}
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

      {showDistritos ? (
        <Source
          id="peru-admin-distritos"
          type="vector"
          tiles={[distritosTilesUrl]}
          minzoom={8}
          maxzoom={13}
        >
          <Layer
            id="peru-distritos-fill"
            type="fill"
            source-layer="distritos"
            layout={{ visibility: "visible" }}
            filter={
              selectedCodes.dist
                ? (districtsWithPointsFilter
                    ? ([
                        "all",
                        ["==", ["get", "UBIGEO"], selectedCodes.dist],
                        districtsWithPointsFilter,
                      ] as any)
                    : (["==", ["get", "UBIGEO"], selectedCodes.dist] as any))
                : (districtsWithPointsFilter
                    ? (["all", distritoFilter, districtsWithPointsFilter] as any)
                    : distritoFilter)
            }
            paint={{
              "fill-color": "rgba(248,113,113,0.22)",
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-distritos-highlight"
            type="fill"
            source-layer="distritos"
            layout={{
              visibility:
                enableHighlight && selectedCodes.dist ? "visible" : "none",
            }}
            filter={
              selectedCodes.dist
                ? (districtsWithPointsFilter
                    ? ([
                        "all",
                        ["==", ["get", "UBIGEO"], selectedCodes.dist],
                        districtsWithPointsFilter,
                      ] as any)
                    : (["==", ["get", "UBIGEO"], selectedCodes.dist] as any))
                : (["==", ["get", "UBIGEO"], ""] as any)
            }
            paint={{
              "fill-color": highlightFillColor,
              "fill-opacity": highlightFillOpacity,
            }}
          />
          <Layer
            id="peru-distritos-line"
            type="line"
            source-layer="distritos"
            layout={{ visibility: "visible", "line-join": "round", "line-cap": "round" }}
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
          {hoverCodes?.dist ? (
            <Layer
              id="peru-distritos-hover"
              type="line"
              source-layer="distritos"
              layout={{ visibility: "visible" }}
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
