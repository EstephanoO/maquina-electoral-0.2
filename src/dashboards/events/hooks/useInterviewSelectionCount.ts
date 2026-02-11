import useSWR from "swr";
import type { MapHierarchySelection } from "@/maps/hierarchy/types";

type InterviewSelectionCountResponse = {
  count: number;
};

type UseInterviewSelectionCountParams = {
  clientKey?: string;
  selection: MapHierarchySelection | null;
  refreshInterval?: number;
};

export const useInterviewSelectionCount = ({
  clientKey,
  selection,
  refreshInterval = 15000,
}: UseInterviewSelectionCountParams) => {
  const dataUrl = (() => {
    if (!selection) return null;
    const params = new URLSearchParams();
    if (clientKey) params.set("client", clientKey);
    params.set("level", selection.level);
    if (selection.depCode) params.set("dep", selection.depCode);
    if (selection.provCode) params.set("prov", selection.provCode);
    if (selection.distCode) params.set("dist", selection.distCode);

    if (selection.level === "departamento" && !selection.depCode) return null;
    if (selection.level === "provincia" && (!selection.depCode || !selection.provCode)) return null;
    if (selection.level === "distrito" && !selection.distCode) return null;

    return `/api/interview-selection-count?${params.toString()}`;
  })();

  const fetcher = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("selection-count-failed");
    return response.json() as Promise<InterviewSelectionCountResponse>;
  };

  const { data, error, isLoading } = useSWR<InterviewSelectionCountResponse>(
    dataUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    },
  );

  return {
    count: data?.count ?? null,
    error,
    isLoading,
  };
};
