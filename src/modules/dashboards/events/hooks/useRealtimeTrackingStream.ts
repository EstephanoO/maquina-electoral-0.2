"use client";

import * as React from "react";
import type { TrackingPoint } from "./useInterviewerTracking";
import type { AppStateCurrentItem } from "./useAppStateCurrent";

type TrackingPayload = {
  id?: string | null;
  event_id?: string | null;
  eventId?: string | null;
  interviewer?: string | null;
  candidate?: string | null;
  signature?: string | null;
  interviewer_key?: string | null;
  mode?: string | null;
  tracked_at?: string | null;
  timestamp?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  altitude?: number | string | null;
  speed?: number | string | null;
  heading?: number | string | null;
  coords?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    accuracy?: number | string | null;
    altitude?: number | string | null;
    speed?: number | string | null;
    heading?: number | string | null;
    "la titude"?: number | string | null;
  } | null;
};

type AppStatePayload = {
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

type StreamEnvelope = {
  type?: "interviewer_tracking" | "app_state_events";
  payload?: unknown;
};

type UseRealtimeTrackingStreamOptions = {
  streamUrl?: string | null;
  initialTrackingRows?: TrackingPoint[];
  initialTelemetryItems?: AppStateCurrentItem[];
};

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const aVal = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return earthRadius * c;
};

const parseStreamData = (raw: string): StreamEnvelope | null => {
  try {
    const parsed = JSON.parse(raw) as StreamEnvelope;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return null;
  }
  return null;
};

const normalizeTrackingPayload = (payload: TrackingPayload): TrackingPoint | null => {
  const interviewer = payload.interviewer?.trim() ?? "";
  const candidate = payload.candidate?.trim() ?? "";
  const signature = payload.signature?.trim() ?? "";
  const trackedAtRaw = payload.tracked_at ?? payload.timestamp ?? null;
  const trackedAt = trackedAtRaw ? new Date(trackedAtRaw) : null;
  if (!interviewer || !candidate || !signature || !trackedAt || Number.isNaN(trackedAt.getTime())) {
    return null;
  }

  const coords = payload.coords ?? null;
  const latitude = toNumber(payload.latitude ?? coords?.latitude ?? coords?.["la titude"]);
  const longitude = toNumber(payload.longitude ?? coords?.longitude);
  if (latitude === null || longitude === null) return null;

  const id = payload.id?.trim() || crypto.randomUUID();
  const interviewerKey =
    payload.interviewer_key?.trim() || `${interviewer} | ${signature}`;

  return {
    id,
    eventId: payload.event_id ?? payload.eventId ?? null,
    interviewer,
    candidate,
    signature,
    interviewerKey,
    mode: payload.mode?.trim() ?? "",
    trackedAt: trackedAt.toISOString(),
    latitude,
    longitude,
    accuracy: toNumber(payload.accuracy ?? coords?.accuracy),
    altitude: toNumber(payload.altitude ?? coords?.altitude),
    speed: toNumber(payload.speed ?? coords?.speed),
    heading: toNumber(payload.heading ?? coords?.heading),
  };
};

const normalizeAppStatePayload = (
  payload: AppStatePayload,
  previous: AppStateCurrentItem | null,
): AppStateCurrentItem | null => {
  const signature = payload.signature?.trim() ?? "";
  if (!signature) return null;
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : null;
  if (!timestamp || Number.isNaN(timestamp.getTime())) return null;

  const appState = payload.app_state?.trim() ?? null;
  const lastSeenActiveAt =
    appState === "active" ? timestamp.toISOString() : previous?.lastSeenActiveAt ?? null;

  return {
    signature,
    interviewer: payload.interviewer?.trim() ?? previous?.interviewer ?? null,
    candidate: payload.candidate?.trim() ?? previous?.candidate ?? null,
    lastState: appState,
    lastSeenAt: timestamp.toISOString(),
    lastSeenActiveAt,
    lastIsConnected:
      payload.is_connected ?? previous?.lastIsConnected ?? null,
    lastIsInternetReachable:
      payload.is_internet_reachable ?? previous?.lastIsInternetReachable ?? null,
    lastConnectionType:
      payload.connection_type ?? previous?.lastConnectionType ?? null,
    deviceOs: payload.device_os ?? previous?.deviceOs ?? null,
    deviceOsVersion: payload.device_os_version ?? previous?.deviceOsVersion ?? null,
    deviceModel: payload.device_model ?? previous?.deviceModel ?? null,
    appVersion: payload.app_version ?? previous?.appVersion ?? null,
    updatedAt: new Date().toISOString(),
  };
};

export const useRealtimeTrackingStream = ({
  streamUrl,
  initialTrackingRows = [],
  initialTelemetryItems = [],
}: UseRealtimeTrackingStreamOptions) => {
  const [trackingRows, setTrackingRows] = React.useState<TrackingPoint[]>(initialTrackingRows);
  const [telemetryOverrides, setTelemetryOverrides] = React.useState<AppStateCurrentItem[]>(
    initialTelemetryItems,
  );
  const seededRef = React.useRef(false);
  const trackingMapRef = React.useRef(new Map<string, TrackingPoint[]>());
  const telemetryMapRef = React.useRef(new Map<string, AppStateCurrentItem>());

  React.useEffect(() => {
    if (seededRef.current) return;
    if (initialTrackingRows.length === 0 && initialTelemetryItems.length === 0) return;

    const trackingMap = new Map<string, TrackingPoint[]>();
    initialTrackingRows.forEach((row) => {
      trackingMap.set(row.interviewerKey, [row]);
    });
    trackingMapRef.current = trackingMap;
    setTrackingRows(initialTrackingRows);

    const telemetryMap = new Map<string, AppStateCurrentItem>();
    initialTelemetryItems.forEach((item) => {
      if (!item.signature) return;
      telemetryMap.set(item.signature.trim().toLowerCase(), item);
    });
    telemetryMapRef.current = telemetryMap;
    setTelemetryOverrides(Array.from(telemetryMap.values()));

    seededRef.current = true;
  }, [initialTrackingRows, initialTelemetryItems]);

  React.useEffect(() => {
    if (!streamUrl) return;
    const source = new EventSource(streamUrl);

    const handleTrackingEvent = (event: MessageEvent) => {
      const parsed = parseStreamData(event.data);
      const payload = (parsed?.payload ?? parsed ?? {}) as TrackingPayload;
      const normalized = normalizeTrackingPayload(payload);
      if (!normalized) return;

      const key = normalized.interviewerKey;
      const previousRows = trackingMapRef.current.get(key) ?? [];
      const previous = previousRows[0] ?? null;
      const distance =
        previous &&
        Number.isFinite(previous.latitude) &&
        Number.isFinite(previous.longitude)
          ? distanceMeters(
              { latitude: previous.latitude, longitude: previous.longitude },
              { latitude: normalized.latitude, longitude: normalized.longitude },
            )
          : null;
      const withDistance = {
        ...normalized,
        distanceMeters: distance,
      };

      trackingMapRef.current.set(key, [withDistance, ...previousRows].slice(0, 2));
      setTrackingRows((prev) => {
        const next = new Map(prev.map((row) => [row.interviewerKey, row]));
        next.set(key, withDistance);
        return Array.from(next.values());
      });
    };

    const handleAppStateEvent = (event: MessageEvent) => {
      const parsed = parseStreamData(event.data);
      const payload = (parsed?.payload ?? parsed ?? {}) as AppStatePayload;
      const signatureKey = payload.signature?.trim().toLowerCase() ?? "";
      if (!signatureKey) return;
      const previous = telemetryMapRef.current.get(signatureKey) ?? null;
      const normalized = normalizeAppStatePayload(payload, previous);
      if (!normalized) return;

      telemetryMapRef.current.set(signatureKey, normalized);
      setTelemetryOverrides(Array.from(telemetryMapRef.current.values()));
    };

    source.addEventListener("interviewer_tracking", handleTrackingEvent as EventListener);
    source.addEventListener("app_state_events", handleAppStateEvent as EventListener);

    source.onerror = () => {
      // browser auto-reconnect
    };

    return () => {
      source.close();
    };
  }, [streamUrl]);

  return {
    trackingRows,
    telemetryOverrides,
    isStreaming: Boolean(streamUrl),
  };
};
