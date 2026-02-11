import useSWR from "swr";
import { fetchOperators } from "../services/formsAccessApi";
import type { Operator } from "../types";

export const useOperators = () => {
  const { data, error, isLoading, mutate } = useSWR<Operator[]>(
    "operators",
    fetchOperators,
    { revalidateOnFocus: false },
  );

  return {
    operators: data ?? [],
    error,
    isLoading,
    mutate,
  };
};
