import useSWR from "swr";
import type { LandingsPaymentPoint } from "../types/dashboard";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("landings-api");
  const payload = (await response.json()) as { data?: LandingsPaymentPoint[] };
  return payload.data ?? [];
};

export const useLandingsPayments = () => {
  const { data, error, isLoading } = useSWR<LandingsPaymentPoint[]>(
    "/api/landings",
    fetcher,
    {
      refreshInterval: 60000,
      dedupingInterval: 20000,
      revalidateOnFocus: true,
    },
  );

  return {
    landingsPayments: data ?? [],
    landingsError: error ? "No se pudo cargar Landings." : null,
    landingsLoading: isLoading,
  };
};
