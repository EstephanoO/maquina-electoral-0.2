import useSWR from "swr";

type InterviewDepartmentSummaryResponse = {
  total: number;
  departments: Array<{
    code: string;
    name: string;
    count: number;
  }>;
};

type UseInterviewDepartmentSummaryParams = {
  clientKey?: string;
  refreshInterval?: number;
};

export const useInterviewDepartmentSummary = ({
  clientKey,
  refreshInterval = 15000,
}: UseInterviewDepartmentSummaryParams = {}) => {
  const dataUrl = clientKey
    ? `/api/interview-department-summary?client=${encodeURIComponent(clientKey)}`
    : "/api/interview-department-summary";

  const fetcher = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("department-summary-failed");
    return response.json() as Promise<InterviewDepartmentSummaryResponse>;
  };

  const { data, error, isLoading } = useSWR<InterviewDepartmentSummaryResponse>(
    dataUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    },
  );

  return {
    total: data?.total ?? 0,
    departments: data?.departments ?? [],
    error,
    isLoading,
  };
};
