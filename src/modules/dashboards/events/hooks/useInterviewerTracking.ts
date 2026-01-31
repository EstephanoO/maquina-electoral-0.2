import { useCallback } from "react";
import useSWR from "swr";

export type TrackingPoint = {
  id: string;
  eventId: string | null;
  interviewer: string;
  candidate: string;
  signature: string;
  interviewerKey: string;
  mode: string;
  trackedAt: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
};

type UseInterviewerTrackingOptions = {
  dataUrl?: string | null;
  refreshInterval?: number;
};

export const useInterviewerTracking = ({
  dataUrl,
  refreshInterval = 5000,
}: UseInterviewerTrackingOptions = {}) => {
  const fetcher = useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("tracking-failed");
    return response.json() as Promise<{ points: TrackingPoint[] }>;
  }, []);

  const { data, error, isLoading } = useSWR<{ points: TrackingPoint[] }>(
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
    points: data?.points ?? [],
  };
};
