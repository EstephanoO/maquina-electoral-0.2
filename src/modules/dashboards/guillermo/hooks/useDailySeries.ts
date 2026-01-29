import * as React from "react";
import { FACEBOOK_DATASET_PATH } from "../constants/dashboard";
import type { DailyPoint, FacebookPost } from "../types/dashboard";

type DailySeriesOptions = {
  file?: File | null;
  datasetPath?: string;
};

export const useDailySeries = (options: DailySeriesOptions = {}) => {
  const [dailySeries, setDailySeries] = React.useState<DailyPoint[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);
  const datasetPath = options.datasetPath ?? FACEBOOK_DATASET_PATH;
  const fileKey = React.useMemo(
    () =>
      options.file
        ? `${options.file.name}-${options.file.size}-${options.file.lastModified}`
        : "",
    [options.file],
  );

  if (options.file !== undefined) {
    fileRef.current = options.file ?? null;
  }

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const file = fileRef.current;
        const hasFile = Boolean(fileKey && file);
        const payload = hasFile && file
          ? ((JSON.parse(await file.text()) as unknown) as FacebookPost[])
          : await (async () => {
              const response = await fetch(datasetPath, { cache: "force-cache" });
              if (!response.ok) throw new Error("facebook-dataset");
              return (await response.json()) as FacebookPost[];
            })();
        if (!isMounted) return;
        const grouped = new Map<string, { reach: number; interactions: number }>();
        payload.forEach((post) => {
          if (!post.time) return;
          const dateKey = post.time.slice(0, 10);
          const reach = post.viewsCount ?? 0;
          const interactions = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);
          const current = grouped.get(dateKey) ?? { reach: 0, interactions: 0 };
          grouped.set(dateKey, {
            reach: current.reach + reach,
            interactions: current.interactions + interactions,
          });
        });

        const points = Array.from(grouped.entries())
          .map(([dateKey, values]) => ({
            dateKey,
            reach: values.reach,
            interactions: values.interactions,
          }))
          .filter((item) => item.dateKey >= "2025-01-01")
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        setDailySeries(points);
      } catch {
        if (isMounted) setError("No se pudo cargar el dataset diario.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [datasetPath, fileKey]);

  return { dailySeries, dailyError: error };
};
