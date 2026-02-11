import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8GiovannaRegistros, infoFeb8GiovannaStatus } from "@/db/schema";

export const runtime = "nodejs";

type StatusPayload = {
  phone?: string;
  contacted?: boolean;
  replied?: boolean;
  sourceId?: string;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
};

export async function PATCH(request: Request) {
  const payload = (await request.json()) as StatusPayload;
  const phone = payload.phone?.trim();
  const sourceId = payload.sourceId?.trim();
  const homeMapsUrl = payload.homeMapsUrl?.trim() || null;
  const pollingPlaceUrl = payload.pollingPlaceUrl?.trim() || null;
  if (!phone && !sourceId) {
    return NextResponse.json({ error: "Missing phone or sourceId" }, { status: 400 });
  }

  let contacted: boolean | null = null;
  let replied: boolean | null = null;
  let updatedAt: Date | null = null;

  if (phone) {
    contacted = Boolean(payload.contacted);
    replied = Boolean(payload.replied);
    updatedAt = new Date();
    await dbInfo
      .insert(infoFeb8GiovannaStatus)
      .values({ phone, contacted, replied, updatedAt })
      .onConflictDoUpdate({
        target: infoFeb8GiovannaStatus.phone,
        set: { contacted, replied, updatedAt },
      });
  }

  if (sourceId) {
    await dbInfo
      .update(infoFeb8GiovannaRegistros)
      .set({ homeMapsUrl, pollingPlaceUrl })
      .where(eq(infoFeb8GiovannaRegistros.sourceId, sourceId));
  }

  return NextResponse.json({
    phone,
    contacted: contacted ?? undefined,
    replied: replied ?? undefined,
    updatedAt: updatedAt ? updatedAt.getTime() : undefined,
    sourceId,
    homeMapsUrl,
    pollingPlaceUrl,
  });
}
