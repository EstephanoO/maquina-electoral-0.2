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
  daySeries: [],
  cities: [],
};

export const usePanoramaData = () => {
  const [panoramaData, setPanoramaData] = React.useState<PanoramaData>(emptyPanoramaData);
  const [panoramaLoading, setPanoramaLoading] = React.useState(true);
  const [panoramaError, setPanoramaError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch(PANORAMA_REPORT_PATH, { cache: "force-cache" });
        const fallback = response.ok
          ? response
          : await fetch(PANORAMA_REPORT_PATH_ALT, { cache: "force-cache" });
        if (!fallback.ok) throw new Error("panorama");
        const text = await fallback.text();
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
  }, []);

  return { panoramaData, panoramaLoading, panoramaError };
};
