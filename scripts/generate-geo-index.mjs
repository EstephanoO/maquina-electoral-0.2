import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const GEO_DIR = path.join(ROOT, "public", "geo");

const DEPARTAMENTOS_FILE = "departamentos 2.geojson";
const PROVINCIAS_FILE = "provincias.geojson";
const DISTRITOS_FILE = "distritos.geojson";
const OUTPUT_FILE = "index.json";

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const getGeometryBounds = (geometry) => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const addPoint = (coord) => {
    const [lng, lat] = coord;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  };

  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (coords.length === 2 && coords.every((value) => typeof value === "number")) {
      addPoint(coords);
      return;
    }
    for (const item of coords) {
      walk(item);
    }
  };

  walk(geometry.coordinates);

  return [minLng, minLat, maxLng, maxLat];
};

const buildGeoIndex = ({ departamentos, provincias, distritos }) => {
  const nodes = {};
  const byCode = { departamento: {}, provincia: {}, distrito: {} };

  const addNode = (node) => {
    nodes[node.id] = node;
    if (node.level === "departamento") {
      byCode.departamento[node.codes.dep] = node.id;
    }
    if (node.level === "provincia") {
      byCode.provincia[`${node.codes.dep}${node.codes.prov}`] = node.id;
    }
    if (node.level === "distrito") {
      byCode.distrito[node.codes.dist] = node.id;
    }
  };

  const buildId = (level, code) => `${level}:${code}`;

  for (const feature of departamentos.features) {
    const props = feature.properties ?? {};
    const code = String(props.CODDEP ?? "");
    if (!code) continue;
    addNode({
      id: buildId("departamento", code),
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
    addNode({
      id: buildId("provincia", `${dep}${prov}`),
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
    addNode({
      id: buildId("distrito", dist),
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
        departamentos: `/geo/${DEPARTAMENTOS_FILE}`,
        provincias: `/geo/${PROVINCIAS_FILE}`,
        distritos: `/geo/${DISTRITOS_FILE}`,
      },
    },
    nodes,
    byCode,
  };
};

const main = async () => {
  const departamentos = await readJson(path.join(GEO_DIR, DEPARTAMENTOS_FILE));
  const provincias = await readJson(path.join(GEO_DIR, PROVINCIAS_FILE));
  const distritos = await readJson(path.join(GEO_DIR, DISTRITOS_FILE));

  const index = buildGeoIndex({ departamentos, provincias, distritos });
  const outputPath = path.join(GEO_DIR, OUTPUT_FILE);
  await fs.writeFile(outputPath, JSON.stringify(index), "utf8");
  console.log(`Geo index written to ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
