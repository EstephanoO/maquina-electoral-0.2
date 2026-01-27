"use client";

import * as React from "react";
import { MapPanel } from "@/modules/maps/MapPanel";

type MapPoint = {
  latitude: number | null;
  longitude: number | null;
};

export const MapLivePanel = ({ className }: { className?: string }) => {
  const [points, setPoints] = React.useState<Array<{ lat: number; lng: number }>>([]);

  React.useEffect(() => {
    let isMounted = true;

    const loadPoints = async () => {
      const response = await fetch("/api/interviews", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { points: MapPoint[] };
      const next = (data.points ?? [])
        .filter((point) => point.latitude !== null && point.longitude !== null)
        .map((point) => ({
          lat: point.latitude as number,
          lng: point.longitude as number,
        }));
      if (isMounted) {
        setPoints(next);
      }
    };

    loadPoints();

    return () => {
      isMounted = false;
    };
  }, []);

  return <MapPanel height={null} className={className} points={points} />;
};
