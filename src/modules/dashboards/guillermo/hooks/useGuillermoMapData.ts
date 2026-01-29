import * as React from "react";
import type { MapData } from "../dashboard/GuillermoMap";
import { GUILLERMO_MAP_DATASETS } from "../constants/dashboard";

export const useGuillermoMapData = () => {
  const [mapData, setMapData] = React.useState<MapData | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const responses = await Promise.all(
          GUILLERMO_MAP_DATASETS.map((dataset) =>
            fetch(`/guillermo/mapa-guillermo/${dataset}.geojson`, {
              cache: "force-cache",
            }).then((response) => (response.ok ? response.json() : null)),
          ),
        );
        if (!isMounted) return;
        const [departamentos, actividades, votantes, paneles] = responses;
        setMapData({
          departamentos: departamentos ?? undefined,
          actividades: actividades ?? undefined,
          votantes: votantes ?? undefined,
          paneles: paneles ?? undefined,
        });
      } catch {
        if (isMounted) setMapError("No se pudo cargar el mapa territorial.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { mapData, mapError };
};
