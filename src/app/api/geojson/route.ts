import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { campaignGeojson } from "@/db/schema";
import { resolveCampaignIdFromClient } from "@/lib/clientMappings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientParam = url.searchParams.get("client");
  const campaignIdParam = url.searchParams.get("campaignId");
  const layerType = url.searchParams.get("layerType");
  const campaignId = campaignIdParam ?? resolveCampaignIdFromClient(clientParam);
  const allowedLayerTypes = ["departamento", "provincia", "distrito"] as const;
  const normalizedLayerType = layerType
    ? allowedLayerTypes.find((value) => value === layerType)
    : null;

  if (!campaignId) {
    return NextResponse.json({ layers: null }, { status: 200 });
  }
  if (layerType && !normalizedLayerType) {
    return NextResponse.json({ error: "Invalid layerType" }, { status: 400 });
  }

  const rows = await db
    .select({
      geojson: campaignGeojson.geojson,
      fileName: campaignGeojson.fileName,
      updatedAt: campaignGeojson.updatedAt,
      layerType: campaignGeojson.layerType,
    })
    .from(campaignGeojson)
    .where(eq(campaignGeojson.campaignId, campaignId));

  if (normalizedLayerType) {
    const record = rows.find((row) => row.layerType === normalizedLayerType);
    return NextResponse.json(
      {
        layerType: normalizedLayerType,
        geojson: record?.geojson ?? null,
        fileName: record?.fileName ?? null,
        updatedAt: record?.updatedAt ?? null,
      },
      { status: 200 },
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
              geojson: layers.departamento.geojson,
              fileName: layers.departamento.fileName,
              updatedAt: layers.departamento.updatedAt,
            }
          : null,
        provincia: layers.provincia
          ? {
              geojson: layers.provincia.geojson,
              fileName: layers.provincia.fileName,
              updatedAt: layers.provincia.updatedAt,
            }
          : null,
        distrito: layers.distrito
          ? {
              geojson: layers.distrito.geojson,
              fileName: layers.distrito.fileName,
              updatedAt: layers.distrito.updatedAt,
            }
          : null,
      },
    },
    { status: 200 },
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

  const payload = body.geojson as { type?: string; features?: unknown[] };
  if (!payload || payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    return NextResponse.json({ error: "Invalid GeoJSON" }, { status: 400 });
  }
  if (payload.features.length > 200000) {
    return NextResponse.json({ error: "GeoJSON too large" }, { status: 400 });
  }

  const payloadText = JSON.stringify(payload);
  await db.execute(sql`
    insert into public.campaign_geojson (campaign_id, layer_type, geojson, file_name, geom, updated_at)
    values (
      ${body.campaignId},
      ${normalizedLayerType},
      ${payloadText}::jsonb,
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
        file_name = excluded.file_name,
        geom = excluded.geom,
        updated_at = now();
  `);

  return NextResponse.json({ ok: true }, { status: 200 });
}

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
