import useSWR from "swr";

type InterviewDistrictsResponse = {
  districts: string[];
};

type UseInterviewDistrictsParams = {
  clientKey?: string;
  refreshInterval?: number;
};

export const useInterviewDistricts = ({
  clientKey,
  refreshInterval = 15000,
}: UseInterviewDistrictsParams = {}) => {
  const dataUrl = clientKey
    ? `/api/interview-districts?client=${encodeURIComponent(clientKey)}`
    : "/api/interview-districts";

  const fetcher = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("districts-failed");
    return response.json() as Promise<InterviewDistrictsResponse>;
  };

  const { data, error, isLoading } = useSWR<InterviewDistrictsResponse>(
    dataUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    },
  );

  return {
    districts: data?.districts ?? [],
    error,
    isLoading,
  };
};
