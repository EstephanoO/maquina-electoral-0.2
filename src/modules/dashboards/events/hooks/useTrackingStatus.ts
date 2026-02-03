import * as React from "react";
import type { TrackingPoint } from "./useInterviewerTracking";
import { useAppStateCurrent } from "./useAppStateCurrent";
import type { AppStateCurrentItem } from "./useAppStateCurrent";
import type { MapPoint } from "../utils/dataUtils";

type StatusValue = "connected" | "stationary" | "inactive";

type InterviewerStatus = {
  key: string;
  interviewer: string;
  mode: string;
  trackedAt: string;
  isMoving: boolean;
  isActive: boolean;
  isConnected: boolean;
  status: StatusValue;
};

type UseTrackingStatusOptions = {
  trackingRows: TrackingPoint[];
  candidateLabels: string[];
  presenceThresholdMs: number;
  movementThresholdMeters: number;
};

const buildTelemetryMap = (items: AppStateCurrentItem[]) => {
  const map = new Map<string, AppStateCurrentItem>();
  for (const item of items) {
    if (!item.signature) continue;
    map.set(item.signature.trim().toLowerCase(), item);
  }
  return map;
};

const computeStatus = (
  now: number,
  row: TrackingPoint,
  telemetry: AppStateCurrentItem | undefined,
  presenceThresholdMs: number,
  movementThresholdMeters: number,
) => {
  const lastSeenActiveAt = telemetry?.lastSeenActiveAt
    ? new Date(telemetry.lastSeenActiveAt).getTime()
    : null;
  const lastState = telemetry?.lastState?.toLowerCase() ?? null;
  const trackedAt = new Date(row.trackedAt).getTime();
  const trackedRecent = Number.isFinite(trackedAt) ? now - trackedAt <= presenceThresholdMs : false;
  const isActive = lastState && lastState !== "active"
    ? false
    : lastSeenActiveAt
      ? now - lastSeenActiveAt <= presenceThresholdMs
      : trackedRecent;
  const isConnected =
    telemetry?.lastIsInternetReachable === true || telemetry?.lastIsConnected === true;
  const distanceMeters = row.distanceMeters;
  const hasDistance = typeof distanceMeters === "number" && Number.isFinite(distanceMeters);
  const isMoving = hasDistance
    ? distanceMeters > movementThresholdMeters
    : row.mode?.toLowerCase() === "moving";
  const status = !isActive
    ? "inactive"
    : !isMoving
      ? "stationary"
      : isConnected
        ? "connected"
        : "inactive";

  return {
    isActive,
    isConnected,
    isMoving,
    status,
  } as const;
};

export const useTrackingStatus = ({
  trackingRows,
  candidateLabels,
  presenceThresholdMs,
  movementThresholdMeters,
}: UseTrackingStatusOptions) => {
  const telemetrySignatures = React.useMemo(() => {
    const signatures = new Set<string>();
    for (const row of trackingRows) {
      if (row.signature) signatures.add(row.signature);
    }
    return Array.from(signatures);
  }, [trackingRows]);

  const telemetryUrl = React.useMemo(() => {
    if (telemetrySignatures.length === 0) return null;
    const params = new URLSearchParams();
    for (const signature of telemetrySignatures) {
      params.append("signature", signature);
    }
    return `/api/v1/telemetry/app-state?${params.toString()}`;
  }, [telemetrySignatures]);

  const { items: telemetryItems } = useAppStateCurrent({ dataUrl: telemetryUrl });
  const telemetryBySignature = React.useMemo(
    () => buildTelemetryMap(telemetryItems),
    [telemetryItems],
  );

  const trackingPoints = React.useMemo((): MapPoint[] => {
    const now = Date.now();
    const candidateSet = new Set(
      candidateLabels.map((label) => label.trim().toLowerCase()).filter(Boolean),
    );
    return trackingRows
      .filter((row) => {
        if (candidateSet.size === 0) return true;
        const candidateValue = row.candidate?.trim().toLowerCase();
        return candidateValue ? candidateSet.has(candidateValue) : false;
      })
      .map((row) => {
        const signatureKey = row.signature?.trim().toLowerCase() ?? "";
        const telemetry = signatureKey ? telemetryBySignature.get(signatureKey) : undefined;
        const computed = computeStatus(
          now,
          row,
          telemetry,
          presenceThresholdMs,
          movementThresholdMeters,
        );
        return {
          online: computed.isActive,
          lat: row.latitude,
          lng: row.longitude,
          interviewer: row.interviewer,
          candidate: row.candidate,
          createdAt: row.trackedAt,
          kind: "tracking" as const,
          mode: row.mode,
          signature: row.signature,
          accuracy: row.accuracy,
          altitude: row.altitude,
          speed: row.speed,
          heading: row.heading,
          isMoving: computed.isMoving,
          isActive: computed.isActive,
          isConnected: computed.isConnected,
          status: computed.status,
        };
      });
  }, [candidateLabels, movementThresholdMeters, presenceThresholdMs, telemetryBySignature, trackingRows]);

  const movingTrackingPoints = React.useMemo(
    () => trackingPoints.filter((point) => point.isMoving ?? point.mode?.toLowerCase() === "moving"),
    [trackingPoints],
  );

  const interviewerStatus = React.useMemo((): InterviewerStatus[] => {
    const now = Date.now();
    return trackingRows
      .map((row) => {
        const signatureKey = row.signature?.trim().toLowerCase() ?? "";
        const telemetry = signatureKey ? telemetryBySignature.get(signatureKey) : undefined;
        const computed = computeStatus(
          now,
          row,
          telemetry,
          presenceThresholdMs,
          movementThresholdMeters,
        );
        return {
          key: row.interviewerKey,
          interviewer: row.interviewer,
          mode: row.mode,
          trackedAt: row.trackedAt,
          isMoving: computed.isMoving,
          isActive: computed.isActive,
          isConnected: computed.isConnected,
          status: computed.status,
        };
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        if (a.isMoving !== b.isMoving) return a.isMoving ? -1 : 1;
        return a.interviewer.localeCompare(b.interviewer);
      });
  }, [movementThresholdMeters, presenceThresholdMs, telemetryBySignature, trackingRows]);

  return {
    trackingPoints,
    movingTrackingPoints,
    interviewerStatus,
  };
};
