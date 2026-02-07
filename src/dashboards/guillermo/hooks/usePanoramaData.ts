import * as React from "react";
import {
  PANORAMA_REPORT_PATH,
  PANORAMA_REPORT_PATH_ALT,
} from "../constants/dashboard";
import { parsePanoramaCSV } from "../utils/panoramaParser";
import type { PanoramaData } from "../types/dashboard";

const emptyPanoramaData: PanoramaData = {
  summary: null,
  pages: [],
  userSources: [],
  sessionSources: [],
  dailyActive: [],
  dailyNew: [],
  dailyEngagement: [],
  cities: [],
};

type PanoramaOptions = {
  file?: File | null;
  cacheMode?: RequestCache;
};

export const usePanoramaData = (options: PanoramaOptions = {}) => {
  const [panoramaData, setPanoramaData] = React.useState<PanoramaData>(emptyPanoramaData);
  const [panoramaLoading, setPanoramaLoading] = React.useState(true);
  const [panoramaError, setPanoramaError] = React.useState<string | null>(null);
  const fileRef = React.useRef<File | null>(null);
  const cacheMode = options.cacheMode ?? "force-cache";
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
        if (isMounted) {
          setPanoramaLoading(true);
          setPanoramaError(null);
        }
        const file = fileRef.current;
        const hasFile = Boolean(fileKey && file);
        const text = hasFile && file
          ? await file.text()
          : await (async () => {
              const response = await fetch(PANORAMA_REPORT_PATH, { cache: cacheMode });
              const fallback = response.ok
                ? response
                : await fetch(PANORAMA_REPORT_PATH_ALT, { cache: cacheMode });
              if (!fallback.ok) throw new Error("panorama");
              return await fallback.text();
            })();
        if (!isMounted) return;
        const parsed = parsePanoramaCSV(text);
        setPanoramaData(parsed);
      } catch {
        if (isMounted) {
          setPanoramaError("No se pudo cargar el informe panoramico.");
        }
      } finally {
        if (isMounted) setPanoramaLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [cacheMode, fileKey]);

  return { panoramaData, panoramaLoading, panoramaError };
};
