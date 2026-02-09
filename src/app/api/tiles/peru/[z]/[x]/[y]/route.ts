import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { kv } from "@vercel/kv";
import { db } from "@/db/connection";

type RouteParams = {
  params: Promise<{ z: string; x: string; y: string }>;
};

export const runtime = "nodejs";

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=604800",
  "Content-Type": "application/x-protobuf",
};

const TILE_CACHE_LIMIT = 2000;
const TILE_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const TILE_KV_TTL_SECONDS = 60 * 60 * 24 * 30;
const TILE_KV_EMPTY = "__empty__";

const isKvAvailable = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

type TileCacheEntry = {
  buffer: Buffer | null;
  status: 200 | 204;
  expiresAt: number;
};

const getTileCache = () => {
  const globalForCache = globalThis as typeof globalThis & {
    __peruTilesCache?: Map<string, TileCacheEntry>;
  };
  if (!globalForCache.__peruTilesCache) {
    globalForCache.__peruTilesCache = new Map();
  }
  return globalForCache.__peruTilesCache;
};

const readFromCache = (cache: Map<string, TileCacheEntry>, key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry;
};

const writeToCache = (
  cache: Map<string, TileCacheEntry>,
  key: string,
  entry: TileCacheEntry,
) => {
  if (cache.size >= TILE_CACHE_LIMIT) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, entry);
};

const buildTileResponse = (buffer: Buffer) => {
  const body = new Uint8Array(buffer);
  return new NextResponse(body, { status: 200, headers: cacheHeaders });
};

export async function GET(request: Request, { params }: RouteParams) {
  const { z, x, y } = await params;
  const zNum = Number(z);
  const xNum = Number(x);
  const yNum = Number(y);
  const url = new URL(request.url);
  const layerParam = url.searchParams.get("layer");
  const versionParam = url.searchParams.get("v") ?? "default";
  const layer =
    layerParam === "departamentos" ||
    layerParam === "provincias" ||
    layerParam === "distritos"
      ? layerParam
      : "all";

  if (![zNum, xNum, yNum].every((value) => Number.isInteger(value))) {
    return new NextResponse(null, { status: 400 });
  }
  if (zNum < 0 || zNum > 14) {
    return new NextResponse(null, { status: 204, headers: cacheHeaders });
  }

  const cacheKey = `${layer}:${versionParam}:${zNum}:${xNum}:${yNum}`;
  const tileCache = getTileCache();
  const cached = readFromCache(tileCache, cacheKey);
  if (cached) {
    if (cached.status === 204 || !cached.buffer) {
      return new NextResponse(null, { status: 204, headers: cacheHeaders });
    }
    return buildTileResponse(cached.buffer);
  }

  if (isKvAvailable()) {
    const kvKey = `peru-tiles:${cacheKey}`;
    const kvValue = await kv.get<string>(kvKey);
    if (kvValue === TILE_KV_EMPTY) {
      writeToCache(tileCache, cacheKey, {
        buffer: null,
        status: 204,
        expiresAt: Date.now() + TILE_CACHE_TTL_MS,
      });
      return new NextResponse(null, { status: 204, headers: cacheHeaders });
    }
    if (kvValue) {
      const buffer = Buffer.from(kvValue, "base64");
      writeToCache(tileCache, cacheKey, {
        buffer,
        status: 200,
        expiresAt: Date.now() + TILE_CACHE_TTL_MS,
      });
      return buildTileResponse(buffer);
    }
  }

  const query =
    layer === "departamentos"
      ? sql`
        WITH bounds AS (
          SELECT ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}) AS geom
        )
        SELECT encode(
          ST_AsMVT(q, 'departamentos', 4096, 'geom'),
          'base64'
        ) AS tile
        FROM (
          SELECT
            d.coddep AS "CODDEP",
            d.nomdep AS "NOMDEP",
            ST_AsMVTGeom(
              CASE
                WHEN ${zNum} <= 4 THEN ST_SimplifyPreserveTopology(d.geom3857, 2500)
                WHEN ${zNum} <= 6 THEN ST_SimplifyPreserveTopology(d.geom3857, 1200)
                WHEN ${zNum} <= 8 THEN ST_SimplifyPreserveTopology(d.geom3857, 600)
                WHEN ${zNum} <= 10 THEN ST_SimplifyPreserveTopology(d.geom3857, 300)
                ELSE d.geom3857
              END,
              b.geom,
              4096,
              128,
              true
            ) AS geom
          FROM public.peru_departamentos d, bounds b
          WHERE ST_Intersects(d.geom3857, b.geom)
        ) q;
      `
      : layer === "provincias"
        ? sql`
        WITH bounds AS (
          SELECT ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}) AS geom
        )
        SELECT encode(
          ST_AsMVT(q, 'provincias', 4096, 'geom'),
          'base64'
        ) AS tile
        FROM (
          SELECT
            p.coddep AS "CODDEP",
            p.codprov AS "CODPROV",
            p.nomprov AS "NOMPROV",
            ST_AsMVTGeom(
              CASE
                WHEN ${zNum} <= 6 THEN ST_SimplifyPreserveTopology(p.geom3857, 1500)
                WHEN ${zNum} <= 8 THEN ST_SimplifyPreserveTopology(p.geom3857, 700)
                WHEN ${zNum} <= 10 THEN ST_SimplifyPreserveTopology(p.geom3857, 350)
                ELSE p.geom3857
              END,
              b.geom,
              4096,
              128,
              true
            ) AS geom
          FROM public.peru_provincias p, bounds b
          WHERE ST_Intersects(p.geom3857, b.geom)
        ) q;
      `
        : layer === "distritos"
          ? sql`
        WITH bounds AS (
          SELECT ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}) AS geom
        )
        SELECT encode(
          ST_AsMVT(q, 'distritos', 4096, 'geom'),
          'base64'
        ) AS tile
        FROM (
          SELECT
            d.coddep AS "CODDEP",
            d.codprov AS "CODPROV",
            d.ubigeo AS "UBIGEO",
            d.nomdist AS "NOMDIST",
            ST_AsMVTGeom(
              d.geom3857,
              b.geom,
              4096,
              128,
              true
            ) AS geom
          FROM public.peru_distritos d, bounds b
          WHERE ST_Intersects(d.geom3857, b.geom)
        ) q;
      `
          : sql`
        WITH bounds AS (
          SELECT ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}) AS geom
        ),
        departamentos AS (
          SELECT ST_AsMVT(q, 'departamentos', 4096, 'geom') AS mvt
          FROM (
            SELECT
              d.coddep AS "CODDEP",
              d.nomdep AS "NOMDEP",
              ST_AsMVTGeom(
                CASE
                  WHEN ${zNum} <= 4 THEN ST_SimplifyPreserveTopology(d.geom3857, 2500)
                  WHEN ${zNum} <= 6 THEN ST_SimplifyPreserveTopology(d.geom3857, 1200)
                  WHEN ${zNum} <= 8 THEN ST_SimplifyPreserveTopology(d.geom3857, 600)
                  WHEN ${zNum} <= 10 THEN ST_SimplifyPreserveTopology(d.geom3857, 300)
                  ELSE d.geom3857
                END,
                b.geom,
                4096,
                128,
                true
              ) AS geom
            FROM public.peru_departamentos d, bounds b
            WHERE ST_Intersects(d.geom3857, b.geom)
          ) q
        ),
        provincias AS (
          SELECT ST_AsMVT(q, 'provincias', 4096, 'geom') AS mvt
          FROM (
            SELECT
              p.coddep AS "CODDEP",
              p.codprov AS "CODPROV",
              p.nomprov AS "NOMPROV",
              ST_AsMVTGeom(
                CASE
                  WHEN ${zNum} <= 6 THEN ST_SimplifyPreserveTopology(p.geom3857, 1500)
                  WHEN ${zNum} <= 8 THEN ST_SimplifyPreserveTopology(p.geom3857, 700)
                  WHEN ${zNum} <= 10 THEN ST_SimplifyPreserveTopology(p.geom3857, 350)
                  ELSE p.geom3857
                END,
                b.geom,
                4096,
                128,
                true
              ) AS geom
            FROM public.peru_provincias p, bounds b
            WHERE ST_Intersects(p.geom3857, b.geom)
          ) q
        ),
        distritos AS (
          SELECT ST_AsMVT(q, 'distritos', 4096, 'geom') AS mvt
          FROM (
            SELECT
              d.coddep AS "CODDEP",
              d.codprov AS "CODPROV",
              d.ubigeo AS "UBIGEO",
              d.nomdist AS "NOMDIST",
              ST_AsMVTGeom(
                d.geom3857,
                b.geom,
                4096,
                128,
                true
              ) AS geom
            FROM public.peru_distritos d, bounds b
            WHERE ST_Intersects(d.geom3857, b.geom)
          ) q
        )
        SELECT encode(
          COALESCE((SELECT mvt FROM departamentos), ''::bytea) ||
          COALESCE((SELECT mvt FROM provincias), ''::bytea) ||
          COALESCE((SELECT mvt FROM distritos), ''::bytea),
          'base64'
        ) AS tile;
      `;

  const { rows } = await db.execute(query);

  const tileBase64 = rows[0]?.tile as string | undefined;
  if (!tileBase64) {
    if (isKvAvailable()) {
      await kv.set(`peru-tiles:${cacheKey}`, TILE_KV_EMPTY, {
        ex: TILE_KV_TTL_SECONDS,
      });
    }
    writeToCache(tileCache, cacheKey, {
      buffer: null,
      status: 204,
      expiresAt: Date.now() + TILE_CACHE_TTL_MS,
    });
    return new NextResponse(null, { status: 204, headers: cacheHeaders });
  }

  const buffer = Buffer.from(tileBase64, "base64");
  if (buffer.length === 0) {
    if (isKvAvailable()) {
      await kv.set(`peru-tiles:${cacheKey}`, TILE_KV_EMPTY, {
        ex: TILE_KV_TTL_SECONDS,
      });
    }
    writeToCache(tileCache, cacheKey, {
      buffer: null,
      status: 204,
      expiresAt: Date.now() + TILE_CACHE_TTL_MS,
    });
    return new NextResponse(null, { status: 204, headers: cacheHeaders });
  }

  if (isKvAvailable()) {
    await kv.set(`peru-tiles:${cacheKey}`, tileBase64, {
      ex: TILE_KV_TTL_SECONDS,
    });
  }

  writeToCache(tileCache, cacheKey, {
    buffer,
    status: 200,
    expiresAt: Date.now() + TILE_CACHE_TTL_MS,
  });

  return buildTileResponse(buffer);
}
