"use client";

import * as React from "react";
import useSWR from "swr";
import { PeruMapPanel } from "@/modules/maps/PeruMapPanel";

type MapPoint = {
  latitude: number | null;
  longitude: number | null;
};

export const MapLivePanel = ({
  className,
  client,
  candidate,
}: {
  className?: string;
  client?: string;
  candidate?: string;
}) => {
  const params = React.useMemo(() => {
    const query = new URLSearchParams();
    if (client) query.set("client", client);
    if (candidate) query.set("candidate", candidate);
    return query.toString();
  }, [client, candidate]);

  const key = params ? `/api/interviews?${params}` : "/api/interviews";

  const fetcher = React.useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("points-failed");
    return response.json() as Promise<{ points: MapPoint[] }>;
  }, []);

  const { data, error, isLoading } = useSWR<{ points: MapPoint[] }>(key, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });

  const points = React.useMemo(
    () =>
      (data?.points ?? [])
        .filter((point: MapPoint) => point.latitude !== null && point.longitude !== null)
        .map((point: MapPoint) => ({
          lat: point.latitude as number,
          lng: point.longitude as number,
        })),
    [data],
  );

  const status = isLoading
    ? "loading"
    : error
      ? "error"
      : points.length > 0
        ? "ready"
        : "empty";

  return (
    <PeruMapPanel
      height={null}
      className={className}
      points={points}
      status={status === "ready" ? undefined : status}
    />
  );
};
