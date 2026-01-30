export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export const formatCurrencyPen = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const formatRatioPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export const formatSeconds = (value: number) => `${value.toFixed(1)}s`;

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });

export const formatDate = (date: Date) =>
  date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const truncateText = (value: string, max = 42) =>
  value.length > max ? `${value.slice(0, max - 1)}\u2026` : value;
