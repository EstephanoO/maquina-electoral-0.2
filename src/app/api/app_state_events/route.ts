import { isApiKeyValid, isOriginAllowed } from "@/lib/api/auth";
import { getRequestId, jsonResponse, logApiEvent } from "@/lib/api/http";
import { buildStableId } from "@/lib/api/idempotency";
import { db } from "@/db/connection";
import { appStateCurrent, appStateEvents } from "@/db/schema";

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

const allowedStates = new Set<AppStateValue>(["active", "inactive", "background"]);

const normalizePayload = (payload: AppStatePayload) => {
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
  let body: AppStatePayload | AppStatePayload[];
  try {
    body = (await request.json()) as AppStatePayload | AppStatePayload[];
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

  const status = 202;
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
