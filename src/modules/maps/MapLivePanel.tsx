"use client";

import * as React from "react";
import useSWR from "swr";
import { PeruMapPanel } from "@/modules/maps/PeruMapPanel";
import type { GeoFeatureCollection } from "@/modules/maps/hierarchy/types";

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

  const nivel4Key = client === "giovanna" ? "/geo/nieto_giovanna.geojson" : null;
  const { data: nivel4Data } = useSWR<GeoFeatureCollection>(
    nivel4Key,
    async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("geojson-failed");
      return response.json() as Promise<GeoFeatureCollection>;
    },
    { revalidateOnFocus: false },
  );

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

  const resolvedNivel4 = nivel4Data ?? null;

  return (
    <PeruMapPanel
      height={null}
      className={className}
      points={client === "giovanna" ? [] : points}
      status={status === "ready" ? undefined : status}
      enableHierarchy={client !== "giovanna"}
      showHierarchyControls={client !== "giovanna"}
      clientGeojson={resolvedNivel4}
      clientGeojsonMeta={null}
      clientGeojsonLayers={
        resolvedNivel4
          ? {
              departamento: resolvedNivel4,
              provincia: resolvedNivel4,
              distrito: resolvedNivel4,
            }
          : null
      }
    />
  );
};
