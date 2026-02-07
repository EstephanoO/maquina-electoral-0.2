import useSWR from "swr";
import { useCallback, useRef, useState } from "react";
import type { EventRecord } from "@/ui/dashboards/events/EventRecordsDialog";
import type { MapRef } from "@vis.gl/react-maplibre";

interface UseEventDataParams {
  dataUrl?: string;
  refreshInterval?: number;
}

interface UseEventDataReturn {
  data: { points: EventRecord[] } | undefined;
  error: any;
  isLoading: boolean;
  mutate: any;
  rows: EventRecord[];
  mapRef: React.MutableRefObject<MapRef | null>;
  resetMapView: (() => void) | null;
  setResetMapView: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}

export const useEventData = ({ 
  dataUrl = "/api/interviews", 
  refreshInterval = 8000 
}: UseEventDataParams = {}): UseEventDataReturn => {
  const mapRef = useRef<MapRef | null>(null);
  const [resetMapView, setResetMapView] = useState<(() => void) | null>(null);
  
  const fetcher = useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("points-failed");
    return response.json() as Promise<{ points: EventRecord[] }>;
  }, []);

  const { data, error, isLoading, mutate } = useSWR<{ points: EventRecord[] }>(
    dataUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    },
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    rows: data?.points ?? [],
    mapRef,
    resetMapView,
    setResetMapView,
  };
};
