import { isApiKeyValid, isOriginAllowed } from "@/lib/api/auth";
import { getRequestId, jsonResponse, logApiEvent } from "@/lib/api/http";
import { buildStableId } from "@/lib/api/idempotency";
import { db } from "@/db/connection";
import { appStateCurrent, appStateEvents, interviewerTracking } from "@/db/schema";

type WsEventType = "interviewer_tracking" | "app_state_events";

type WsEventBody = {
  type?: WsEventType | null;
  payload?: unknown;
};

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

type AppStateValue = "active" | "inactive" | "background";

type AppStatePayload = {
  id?: string | null;
  signature?: string | null;
  interviewer?: string | null;
  candidate?: string | null;
  app_state?: string | null;
  timestamp?: string | null;
  is_connected?: boolean | null;
  is_internet_reachable?: boolean | null;
  connection_type?: string | null;
  device_os?: string | null;
  device_os_version?: string | null;
  device_model?: string | null;
  app_version?: string | null;
};

const allowedTypes = new Set<WsEventType>(["interviewer_tracking", "app_state_events"]);
const allowedStates = new Set<AppStateValue>(["active", "inactive", "background"]);

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTrackingPayload = (payload: TrackingPayload) => {
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

const normalizeAppStatePayload = (payload: AppStatePayload) => {
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : null;
  const resolvedTimestamp =
    timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : null;
  const fallbackId =
    payload.signature && payload.timestamp && payload.app_state
      ? buildStableId(
          [payload.signature, payload.timestamp, payload.app_state],
          "appstate",
        )
      : null;

  return {
    id: payload.id?.trim() || fallbackId || crypto.randomUUID(),
    signature: payload.signature?.trim() ?? "",
    interviewer: payload.interviewer?.trim() ?? null,
    candidate: payload.candidate?.trim() ?? null,
    appState: payload.app_state?.trim() ?? "",
    timestamp: resolvedTimestamp,
    isConnected: payload.is_connected ?? null,
    isInternetReachable: payload.is_internet_reachable ?? null,
    connectionType: payload.connection_type ?? null,
    deviceOs: payload.device_os ?? null,
    deviceOsVersion: payload.device_os_version ?? null,
    deviceModel: payload.device_model ?? null,
    appVersion: payload.app_version ?? null,
  };
};

const resolvePayloadItems = <T,>(payload: unknown): T[] | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === "object") return [payload as T];
  return null;
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

  let body: WsEventBody;
  try {
    body = (await request.json()) as WsEventBody;
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

  const eventType = body.type ?? null;
  if (!eventType || !allowedTypes.has(eventType)) {
    const status = 400;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_event_type",
    });
    return jsonResponse({ ok: false, error: "Invalid type" }, requestId, { status });
  }

  if (body.payload === undefined || body.payload === null) {
    const status = 400;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "missing_payload",
    });
    return jsonResponse({ ok: false, error: "Missing payload" }, requestId, { status });
  }

  if (eventType === "interviewer_tracking") {
    const items = resolvePayloadItems<TrackingPayload>(body.payload);
    if (!items) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_payload",
      });
      return jsonResponse({ ok: false, error: "Invalid payload" }, requestId, { status });
    }

    for (const item of items) {
      const normalized = normalizeTrackingPayload(item);
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
        return jsonResponse({ ok: false, error: "Invalid tracked_at" }, requestId, {
          status,
        });
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

    const status = 200;
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

  const items = resolvePayloadItems<AppStatePayload>(body.payload);
  if (!items) {
    const status = 400;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_payload",
    });
    return jsonResponse({ ok: false, error: "Invalid payload" }, requestId, { status });
  }

  for (const item of items) {
    const normalized = normalizeAppStatePayload(item);
    if (!normalized.signature) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_signature",
      });
      return jsonResponse({ ok: false, error: "Missing signature" }, requestId, {
        status,
      });
    }
    if (!normalized.timestamp) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_timestamp",
      });
      return jsonResponse({ ok: false, error: "Invalid timestamp" }, requestId, {
        status,
      });
    }
    if (!allowedStates.has(normalized.appState as AppStateValue)) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_app_state",
      });
      return jsonResponse({ ok: false, error: "Invalid app_state" }, requestId, {
        status,
      });
    }

    await db
      .insert(appStateEvents)
      .values({
        id: normalized.id,
        signature: normalized.signature,
        interviewer: normalized.interviewer,
        candidate: normalized.candidate,
        appState: normalized.appState,
        timestamp: normalized.timestamp,
        isConnected: normalized.isConnected,
        isInternetReachable: normalized.isInternetReachable,
        connectionType: normalized.connectionType,
        deviceOs: normalized.deviceOs,
        deviceOsVersion: normalized.deviceOsVersion,
        deviceModel: normalized.deviceModel,
        appVersion: normalized.appVersion,
      })
      .onConflictDoUpdate({
        target: appStateEvents.id,
        set: {
          signature: normalized.signature,
          interviewer: normalized.interviewer,
          candidate: normalized.candidate,
          appState: normalized.appState,
          timestamp: normalized.timestamp,
          isConnected: normalized.isConnected,
          isInternetReachable: normalized.isInternetReachable,
          connectionType: normalized.connectionType,
          deviceOs: normalized.deviceOs,
          deviceOsVersion: normalized.deviceOsVersion,
          deviceModel: normalized.deviceModel,
          appVersion: normalized.appVersion,
        },
      });

    const lastSeenActiveAt = normalized.appState === "active" ? normalized.timestamp : null;

    await db
      .insert(appStateCurrent)
      .values({
        signature: normalized.signature,
        interviewer: normalized.interviewer,
        candidate: normalized.candidate,
        lastState: normalized.appState,
        lastSeenAt: normalized.timestamp,
        lastSeenActiveAt,
        lastIsConnected: normalized.isConnected,
        lastIsInternetReachable: normalized.isInternetReachable,
        lastConnectionType: normalized.connectionType,
        deviceOs: normalized.deviceOs,
        deviceOsVersion: normalized.deviceOsVersion,
        deviceModel: normalized.deviceModel,
        appVersion: normalized.appVersion,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appStateCurrent.signature,
        set: {
          interviewer: normalized.interviewer,
          candidate: normalized.candidate,
          lastState: normalized.appState,
          lastSeenAt: normalized.timestamp,
          lastSeenActiveAt,
          lastIsConnected: normalized.isConnected,
          lastIsInternetReachable: normalized.isInternetReachable,
          lastConnectionType: normalized.connectionType,
          deviceOs: normalized.deviceOs,
          deviceOsVersion: normalized.deviceOsVersion,
          deviceModel: normalized.deviceModel,
          appVersion: normalized.appVersion,
          updatedAt: new Date(),
        },
      });
  }

  const status = 200;
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
