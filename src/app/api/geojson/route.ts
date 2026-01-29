import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { campaignGeojson } from "@/db/schema";
import { resolveCampaignIdFromClient } from "@/lib/clientMappings";

type GeoJsonPayload = {
  type?: string;
  features?: Array<{ geometry?: { coordinates: unknown }; properties?: Record<string, unknown> }>;
};

export async function GET(request: Request) {
  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  };
  const url = new URL(request.url);
  const clientParam = url.searchParams.get("client");
  const campaignIdParam = url.searchParams.get("campaignId");
  const layerType = url.searchParams.get("layerType");
  const metaOnly = url.searchParams.get("meta") === "1";
  const campaignId = campaignIdParam ?? resolveCampaignIdFromClient(clientParam);
  const allowedLayerTypes = ["departamento", "provincia", "distrito"] as const;
  const normalizedLayerType = layerType
    ? allowedLayerTypes.find((value) => value === layerType)
    : null;

  if (!campaignId) {
    return NextResponse.json({ layers: null }, { status: 200, headers: cacheHeaders });
  }
  if (layerType && !normalizedLayerType) {
    return NextResponse.json({ error: "Invalid layerType" }, { status: 400 });
  }

  const rows = await db
    .select({
      geojson: campaignGeojson.geojson,
      meta: campaignGeojson.meta,
      fileName: campaignGeojson.fileName,
      updatedAt: campaignGeojson.updatedAt,
      layerType: campaignGeojson.layerType,
    })
    .from(campaignGeojson)
    .where(eq(campaignGeojson.campaignId, campaignId));

  if (normalizedLayerType) {
    const record = rows.find((row) => row.layerType === normalizedLayerType);
    if (metaOnly) {
      return NextResponse.json(
        {
          layerType: normalizedLayerType,
          meta: record?.meta ?? null,
          fileName: record?.fileName ?? null,
          updatedAt: record?.updatedAt ?? null,
        },
        { status: 200, headers: cacheHeaders },
      );
    }
    return NextResponse.json(
      {
        layerType: normalizedLayerType,
        geojson: record?.geojson ?? null,
        meta: record?.meta ?? null,
        fileName: record?.fileName ?? null,
        updatedAt: record?.updatedAt ?? null,
      },
      { status: 200, headers: cacheHeaders },
    );
  }

  const layers = {
    departamento: rows.find((row) => row.layerType === "departamento") ?? null,
    provincia: rows.find((row) => row.layerType === "provincia") ?? null,
    distrito: rows.find((row) => row.layerType === "distrito") ?? null,
  };
  return NextResponse.json(
    {
      layers: {
        departamento: layers.departamento
          ? {
              geojson: metaOnly ? null : layers.departamento.geojson,
              meta: layers.departamento.meta ?? null,
              fileName: layers.departamento.fileName,
              updatedAt: layers.departamento.updatedAt,
            }
          : null,
        provincia: layers.provincia
          ? {
              geojson: metaOnly ? null : layers.provincia.geojson,
              meta: layers.provincia.meta ?? null,
              fileName: layers.provincia.fileName,
              updatedAt: layers.provincia.updatedAt,
            }
          : null,
        distrito: layers.distrito
          ? {
              geojson: metaOnly ? null : layers.distrito.geojson,
              meta: layers.distrito.meta ?? null,
              fileName: layers.distrito.fileName,
              updatedAt: layers.distrito.updatedAt,
            }
          : null,
      },
    },
    { status: 200, headers: cacheHeaders },
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    campaignId?: string;
    geojson?: unknown;
    fileName?: string;
    layerType?: string;
  };
  const allowedLayerTypes = ["departamento", "provincia", "distrito"] as const;
  const normalizedLayerType = body.layerType
    ? allowedLayerTypes.find((value) => value === body.layerType)
    : null;

  if (!body.campaignId || !body.geojson || !normalizedLayerType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const payload = body.geojson as GeoJsonPayload;
  if (!payload || payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    return NextResponse.json({ error: "Invalid GeoJSON" }, { status: 400 });
  }
  if (payload.features.length > 200000) {
    return NextResponse.json({ error: "GeoJSON too large" }, { status: 400 });
  }

  const meta = buildGeojsonMeta(payload, normalizedLayerType);

  const payloadText = JSON.stringify(payload);
  await db.execute(sql`
    insert into public.campaign_geojson (campaign_id, layer_type, geojson, meta, file_name, geom, updated_at)
    values (
      ${body.campaignId},
      ${normalizedLayerType},
      ${payloadText}::jsonb,
      ${JSON.stringify(meta)}::jsonb,
      ${body.fileName ?? null},
      (
        select ST_Collect(geom)
        from (
          select ST_SetSRID(
            ST_MakeValid(ST_GeomFromGeoJSON((feat->'geometry')::text)),
            4326
          ) as geom
          from jsonb_array_elements(${payloadText}::jsonb->'features') as feat
          where (feat->'geometry') is not null
        ) as derived
        where geom is not null
      ),
      now()
    )
    on conflict (campaign_id, layer_type) do update
    set geojson = excluded.geojson,
        meta = excluded.meta,
        file_name = excluded.file_name,
        geom = excluded.geom,
        updated_at = now();
  `);

  return NextResponse.json({ ok: true }, { status: 200 });
}

const buildGeojsonMeta = (
  payload: GeoJsonPayload,
  layerType: "departamento" | "provincia" | "distrito",
) => {
  const deps = new Set<string>();
  const provs = new Map<string, { dep: string; prov: string }>();
  const dists = new Set<string>();
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

  for (const feature of payload.features ?? []) {
    if (feature.geometry?.coordinates) {
      walkCoordinates(feature.geometry.coordinates);
    }
    const props = feature.properties ?? {};
    const dep = props.CODDEP ? String(props.CODDEP) : null;
    const prov = props.CODPROV ? String(props.CODPROV) : null;
    const dist = props.UBIGEO ? String(props.UBIGEO) : null;
    if (layerType === "departamento" && dep) deps.add(dep);
    if (layerType === "provincia" && dep && prov) provs.set(`${dep}-${prov}`, { dep, prov });
    if (layerType === "distrito") {
      if (dep) deps.add(dep);
      if (dep && prov) provs.set(`${dep}-${prov}`, { dep, prov });
      if (dist) dists.add(dist);
    }
  }

  const bbox =
    Number.isFinite(minLng) && Number.isFinite(minLat) && Number.isFinite(maxLng) && Number.isFinite(maxLat)
      ? [minLng, minLat, maxLng, maxLat]
      : null;

  return {
    featureCount: payload.features?.length ?? 0,
    bbox,
    codes: {
      deps: deps.size ? Array.from(deps) : [],
      provs: provs.size ? Array.from(provs.values()) : [],
      dists: dists.size ? Array.from(dists) : [],
    },
  };
};

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId");
  const layerType = url.searchParams.get("layerType");
  const allowedLayerTypes = ["departamento", "provincia", "distrito"] as const;
  const normalizedLayerType = layerType
    ? allowedLayerTypes.find((value) => value === layerType)
    : null;

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
  }
  if (layerType && !normalizedLayerType) {
    return NextResponse.json({ error: "Invalid layerType" }, { status: 400 });
  }

  if (normalizedLayerType) {
    await db
      .delete(campaignGeojson)
      .where(
        sql`${campaignGeojson.campaignId} = ${campaignId} and ${campaignGeojson.layerType} = ${normalizedLayerType}`,
      );
  } else {
    await db.delete(campaignGeojson).where(eq(campaignGeojson.campaignId, campaignId));
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
