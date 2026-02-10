import useSWR from "swr";
import { fetchEnabledFormClientIds } from "../services/formsAccessApi";

type UseEnabledFormClientIdsOptions = {
  enabled?: boolean;
};

export const useEnabledFormClientIds = (
  options: UseEnabledFormClientIdsOptions = {},
) => {
  const key = options.enabled === false ? null : "forms-enabled-client-ids";
  const { data, error, isLoading, mutate } = useSWR<string[]>(
    key,
    fetchEnabledFormClientIds,
    { revalidateOnFocus: false },
  );

  return {
    clientIds: data ?? [],
    error,
    isLoading,
    mutate,
  };
};
