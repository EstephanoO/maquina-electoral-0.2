import type { DailyPoint } from "../types/dashboard";

export const calculateAverageReach = (series: DailyPoint[]) => {
  if (!series.length) return 0;
  const total = series.reduce((sum, item) => sum + item.reach, 0);
  return total / series.length;
};

export const calculateTrendSeries = (series: DailyPoint[]) => {
  if (!series.length) return series;
  const n = series.length;
  const sumX = series.reduce((sum, _, index) => sum + index, 0);
  const sumY = series.reduce((sum, item) => sum + item.reach, 0);
  const sumXY = series.reduce((sum, item, index) => sum + index * item.reach, 0);
  const sumX2 = series.reduce((sum, _, index) => sum + index * index, 0);
  const divisor = n * sumX2 - sumX * sumX;
  const slope = divisor === 0 ? 0 : (n * sumXY - sumX * sumY) / divisor;
  const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;
  return series.map((item, index) => ({
    ...item,
    trend: intercept + slope * index,
  }));
};
