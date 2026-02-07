import { isApiKeyValid, isOriginAllowed } from "@/lib/api/auth";
import { getRequestId, jsonResponse, logApiEvent } from "@/lib/api/http";
import { buildStableId } from "@/lib/api/idempotency";
import { db } from "@/db/connection";
import { interviewerTracking } from "@/db/schema";

type TrackingPayload = {
  id?: string | null;
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
  const fallbackId =
    signature && payload.tracked_at && payload.mode
      ? buildStableId(
          [signature, payload.tracked_at, payload.mode, payload.latitude, payload.longitude],
          "track",
        )
      : null;

  return {
    id: payload.id?.trim() || fallbackId || crypto.randomUUID(),
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
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const route = new URL(request.url).pathname;
  const origin = request.headers.get("origin");
  if (!isOriginAllowed(origin)) {
    const status = 403;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "origin_blocked",
    });
    return jsonResponse({ ok: false, error: "Forbidden" }, requestId, { status });
  }
  if (!isApiKeyValid(request)) {
    const status = 401;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_api_key",
    });
    return jsonResponse({ ok: false, error: "Unauthorized" }, requestId, { status });
  }
  let body: TrackingPayload | TrackingPayload[];
  try {
    body = (await request.json()) as TrackingPayload | TrackingPayload[];
  } catch {
    const status = 400;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_json",
    });
    return jsonResponse({ ok: false, error: "Invalid JSON" }, requestId, { status });
  }

  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    const normalized = normalizePayload(item);
    if (!normalized.interviewer || !normalized.candidate || !normalized.signature) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_actor_fields",
      });
      return jsonResponse(
        { ok: false, error: "Missing interviewer, candidate or signature" },
        requestId,
        { status },
      );
    }
    if (!normalized.trackedAt) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_tracked_at",
      });
      return jsonResponse(
        { ok: false, error: "Invalid tracked_at" },
        requestId,
        { status },
      );
    }
    if (normalized.latitude === null || normalized.longitude === null) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_coords",
      });
      return jsonResponse({ ok: false, error: "Invalid coords" }, requestId, { status });
    }
    if (!normalized.mode) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_mode",
      });
      return jsonResponse({ ok: false, error: "Missing mode" }, requestId, { status });
    }

    await db
      .insert(interviewerTracking)
      .values({
        id: normalized.id,
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

  const status = 201;
  logApiEvent({
    requestId,
    route,
    method: "POST",
    status,
    durationMs: Date.now() - startedAt,
    itemsCount: items.length,
  });
  return jsonResponse({ ok: true }, requestId, { status });
}
