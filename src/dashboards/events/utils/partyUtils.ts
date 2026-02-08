export const normalizeCandidateValue = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? "";

export const parseGoalValue = (value: string | null | undefined) => {
  if (!value) return 0;
  const numeric = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

export const formatGoalValue = (value: number) =>
  value > 0 ? value.toLocaleString("en-US") : "0";
