import useSWR from "swr";
import { fetchFormMapPoints } from "../services/formsAccessApi";
import type { FormMapPoint } from "../types";

export const useFormMapPoints = () => {
  const { data, error, isLoading, mutate } = useSWR<FormMapPoint[]>(
    "forms-map",
    fetchFormMapPoints,
    { revalidateOnFocus: false },
  );

  return {
    points: data ?? [],
    error,
    isLoading,
    mutate,
  };
};
