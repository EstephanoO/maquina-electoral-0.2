import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { campaignGeojson } from "@/db/schema";
import { resolveCampaignIdFromClient } from "@/lib/clientMappings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientParam = url.searchParams.get("client");
  const campaignIdParam = url.searchParams.get("campaignId");
  const campaignId = campaignIdParam ?? resolveCampaignIdFromClient(clientParam);

  if (!campaignId) {
    return NextResponse.json({ geojson: null }, { status: 200 });
  }

  const rows = await db
    .select({
      geojson: campaignGeojson.geojson,
      fileName: campaignGeojson.fileName,
      updatedAt: campaignGeojson.updatedAt,
    })
    .from(campaignGeojson)
    .where(eq(campaignGeojson.campaignId, campaignId));

  const record = rows[0];
  return NextResponse.json(
    {
      geojson: record?.geojson ?? null,
      fileName: record?.fileName ?? null,
      updatedAt: record?.updatedAt ?? null,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    campaignId?: string;
    geojson?: unknown;
    fileName?: string;
  };

  if (!body.campaignId || !body.geojson) {
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
    insert into public.campaign_geojson (campaign_id, geojson, file_name, geom, updated_at)
    values (
      ${body.campaignId},
      ${payloadText}::jsonb,
      ${body.fileName ?? null},
      ST_SetSRID(ST_GeomFromGeoJSON(${payloadText}), 4326),
      now()
    )
    on conflict (campaign_id) do update
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

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
  }

  await db.delete(campaignGeojson).where(eq(campaignGeojson.campaignId, campaignId));
  return NextResponse.json({ ok: true }, { status: 200 });
}
