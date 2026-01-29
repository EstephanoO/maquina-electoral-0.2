import type { GeoFeatureCollection, GeoIndex, GeoLevel, GeoNode } from "./types";

const DEPARTAMENTOS_URL = "/geo/departamentos%202.geojson";
const PROVINCIAS_URL = "/geo/provincias.geojson";
const DISTRITOS_URL = "/geo/distritos.geojson";
const INDEX_URL = "/geo/index.json";

const geoJsonCache = new Map<string, Promise<GeoFeatureCollection>>();
let indexPromise: Promise<GeoIndex> | null = null;

export const getGeoJson = (url: string) => {
  if (!geoJsonCache.has(url)) {
    geoJsonCache.set(
      url,
      fetch(url, { cache: "force-cache" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`geojson-fetch-failed:${url}`);
        }
        return (await response.json()) as GeoFeatureCollection;
      }),
    );
  }
  return geoJsonCache.get(url) as Promise<GeoFeatureCollection>;
};

export const getGeoIndex = async () => {
  if (!indexPromise) {
    indexPromise = (async () => {
      let indexResponse: Response | null = null;
      try {
        indexResponse = await fetch(INDEX_URL, { cache: "force-cache" });
      } catch (error) {
        indexResponse = null;
      }
      if (indexResponse?.ok) {
        return (await indexResponse.json()) as GeoIndex;
      }

      const [departamentos, provincias, distritos] = await Promise.all([
        getGeoJson(DEPARTAMENTOS_URL),
        getGeoJson(PROVINCIAS_URL),
        getGeoJson(DISTRITOS_URL),
      ]);
      return buildGeoIndex({ departamentos, provincias, distritos });
    })();
  }
  return indexPromise;
};

export const buildGeoIndex = ({
  departamentos,
  provincias,
  distritos,
}: {
  departamentos: GeoFeatureCollection;
  provincias: GeoFeatureCollection;
  distritos: GeoFeatureCollection;
}): GeoIndex => {
  const nodes: Record<string, GeoNode> = {};
  const byCode: GeoIndex["byCode"] = {
    departamento: {},
    provincia: {},
    distrito: {},
  };

  const addNode = (node: GeoNode) => {
    nodes[node.id] = node;
    if (node.level === "departamento") {
      byCode.departamento[node.codes.dep] = node.id;
    }
    if (node.level === "provincia") {
      if (node.codes.prov) {
        byCode.provincia[`${node.codes.dep}${node.codes.prov}`] = node.id;
      }
    }
    if (node.level === "distrito" && node.codes.dist) {
      byCode.distrito[node.codes.dist] = node.id;
    }
  };

  const buildId = (level: GeoLevel, code: string) => `${level}:${code}`;

  for (const feature of departamentos.features) {
    const props = feature.properties ?? {};
    const code = String(props.CODDEP ?? "");
    if (!code) continue;
    const id = buildId("departamento", code);
    addNode({
      id,
      level: "departamento",
      name: String(props.DEPARTAMEN ?? ""),
      parentId: null,
      children: [],
      bbox: getGeometryBounds(feature.geometry),
      codes: { dep: code },
    });
  }

  for (const feature of provincias.features) {
    const props = feature.properties ?? {};
    const dep = String(props.CODDEP ?? "");
    const prov = String(props.CODPROV ?? "");
    if (!dep || !prov) continue;
    const id = buildId("provincia", `${dep}${prov}`);
    addNode({
      id,
      level: "provincia",
      name: String(props.PROVINCIA ?? ""),
      parentId: buildId("departamento", dep),
      children: [],
      bbox: getGeometryBounds(feature.geometry),
      codes: { dep, prov },
    });
  }

  for (const feature of distritos.features) {
    const props = feature.properties ?? {};
    const dep = String(props.CODDEP ?? "");
    const prov = String(props.CODPROV ?? "");
    const dist = String(props.UBIGEO ?? "");
    if (!dep || !prov || !dist) continue;
    const id = buildId("distrito", dist);
    addNode({
      id,
      level: "distrito",
      name: String(props.DISTRITO ?? ""),
      parentId: buildId("provincia", `${dep}${prov}`),
      children: [],
      bbox: getGeometryBounds(feature.geometry),
      codes: { dep, prov, dist },
    });
  }

  for (const node of Object.values(nodes)) {
    if (node.parentId && nodes[node.parentId]) {
      nodes[node.parentId].children.push(node.id);
    }
  }

  return {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      sources: {
        departamentos: DEPARTAMENTOS_URL,
        provincias: PROVINCIAS_URL,
        distritos: DISTRITOS_URL,
      },
    },
    nodes,
    byCode,
  };
};

const getGeometryBounds = (geometry: { coordinates: unknown }) => {
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

  const walk = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (coords.length === 2 && coords.every((value) => typeof value === "number")) {
      addPoint(coords as number[]);
      return;
    }
    for (const item of coords) {
      walk(item);
    }
  };

  walk(geometry.coordinates);

  return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
};

export const getGeoUrls = () => ({
  departamentos: DEPARTAMENTOS_URL,
  provincias: PROVINCIAS_URL,
  distritos: DISTRITOS_URL,
});
