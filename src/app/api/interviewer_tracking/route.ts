import { NextResponse } from "next/server";
import { db } from "@/db/connection";
import { interviewerTracking } from "@/db/schema";

type TrackingPayload = {
  id?: string | null;
  event_id?: string | null;
  interviewer?: string | null;
  candidate?: string | null;
  signature?: string | null;
  interviewer_key?: string | null;
  mode?: string | null;
  tracked_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  altitude?: number | string | null;
  speed?: number | string | null;
  heading?: number | string | null;
};

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (payload: TrackingPayload) => {
  const interviewer = payload.interviewer?.trim() ?? "";
  const signature = payload.signature?.trim() ?? "";
  const interviewerKey =
    payload.interviewer_key?.trim() || `${interviewer} | ${signature}`;
  const trackedAt = payload.tracked_at ? new Date(payload.tracked_at) : null;
  const resolvedTrackedAt =
    trackedAt && !Number.isNaN(trackedAt.getTime()) ? trackedAt : null;
  const latitude = toNumber(payload.latitude);
  const longitude = toNumber(payload.longitude);

  return {
    id: payload.id?.trim() || crypto.randomUUID(),
    eventId: payload.event_id?.trim() || null,
    interviewer,
    candidate: payload.candidate?.trim() ?? "",
    signature,
    interviewerKey,
    mode: payload.mode?.trim() ?? "",
    trackedAt: resolvedTrackedAt,
    latitude,
    longitude,
    accuracy: toNumber(payload.accuracy),
    altitude: toNumber(payload.altitude),
    speed: toNumber(payload.speed),
    heading: toNumber(payload.heading),
  };
};

export async function POST(request: Request) {
  let body: TrackingPayload | TrackingPayload[];
  try {
    body = (await request.json()) as TrackingPayload | TrackingPayload[];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    const normalized = normalizePayload(item);
    if (!normalized.interviewer || !normalized.candidate || !normalized.signature) {
      return NextResponse.json(
        { ok: false, error: "Missing interviewer, candidate or signature" },
        { status: 400 },
      );
    }
    if (!normalized.trackedAt) {
      return NextResponse.json({ ok: false, error: "Invalid tracked_at" }, { status: 400 });
    }
    if (normalized.latitude === null || normalized.longitude === null) {
      return NextResponse.json({ ok: false, error: "Invalid coords" }, { status: 400 });
    }
    if (!normalized.mode) {
      return NextResponse.json({ ok: false, error: "Missing mode" }, { status: 400 });
    }

    await db
      .insert(interviewerTracking)
      .values({
        id: normalized.id,
        eventId: normalized.eventId,
        interviewer: normalized.interviewer,
        candidate: normalized.candidate,
        signature: normalized.signature,
        interviewerKey: normalized.interviewerKey,
        mode: normalized.mode,
        trackedAt: normalized.trackedAt,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        accuracy: normalized.accuracy,
        altitude: normalized.altitude,
        speed: normalized.speed,
        heading: normalized.heading,
      })
      .onConflictDoUpdate({
        target: interviewerTracking.id,
        set: {
          eventId: normalized.eventId,
          interviewer: normalized.interviewer,
          candidate: normalized.candidate,
          signature: normalized.signature,
          interviewerKey: normalized.interviewerKey,
          mode: normalized.mode,
          trackedAt: normalized.trackedAt,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          accuracy: normalized.accuracy,
          altitude: normalized.altitude,
          speed: normalized.speed,
          heading: normalized.heading,
        },
      });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
