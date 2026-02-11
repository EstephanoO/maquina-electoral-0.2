import useSWR from "swr";
import { fetchFormAccess } from "../services/formsAccessApi";
import type { FormAccessRecord, FormAccessStatus } from "../types";

type FormAccessPayload = {
  records: FormAccessRecord[];
  statuses: FormAccessStatus[];
};

const EMPTY_RECORDS: FormAccessRecord[] = [];
const EMPTY_STATUSES: FormAccessStatus[] = [];

export const useFormAccess = (operatorId?: string | null) => {
  const key = operatorId ? ["forms-access", operatorId] : null;
  const { data, error, isLoading, mutate } = useSWR<FormAccessPayload>(
    key,
    () => fetchFormAccess(operatorId as string),
    { revalidateOnFocus: false },
  );

  return {
    records: data?.records ?? EMPTY_RECORDS,
    statuses: data?.statuses ?? EMPTY_STATUSES,
    error,
    isLoading,
    mutate,
  };
};
