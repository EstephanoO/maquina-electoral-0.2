import { useCallback } from "react";
import useSWR from "swr";

export type AppStateCurrentItem = {
  signature: string;
  interviewer: string | null;
  candidate: string | null;
  lastState: string | null;
  lastSeenAt: string | null;
  lastSeenActiveAt: string | null;
  lastIsConnected: boolean | null;
  lastIsInternetReachable: boolean | null;
  lastConnectionType: string | null;
  deviceOs: string | null;
  deviceOsVersion: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  updatedAt: string | null;
};

type UseAppStateCurrentOptions = {
  dataUrl?: string | null;
  refreshInterval?: number;
};

export const useAppStateCurrent = ({
  dataUrl,
  refreshInterval = 5000,
}: UseAppStateCurrentOptions = {}) => {
  const fetcher = useCallback(async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("app-state-current-failed");
    return response.json() as Promise<{ items: AppStateCurrentItem[] }>;
  }, []);

  const { data, error, isLoading } = useSWR<{ items: AppStateCurrentItem[] }>(
    dataUrl,
    fetcher,
    {
      refreshInterval,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    },
  );

  return {
    data,
    error,
    isLoading,
    items: data?.items ?? [],
  };
};
