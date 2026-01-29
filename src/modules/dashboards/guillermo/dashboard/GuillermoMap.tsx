import * as React from "react";
import { Layer, Source } from "@vis.gl/react-maplibre";
import { MapPanel } from "@/modules/maps/MapPanel";
import { useTheme } from "@/theme/ThemeProvider";

export type MapData = {
  departamentos?: GeoJSON.FeatureCollection;
  actividades?: GeoJSON.FeatureCollection;
  paneles?: GeoJSON.FeatureCollection;
  votantes?: GeoJSON.FeatureCollection;
};

type GuillermoMapProps = {
  data: MapData | null;
  error: string | null;
};

export default function GuillermoMap({ data, error }: GuillermoMapProps) {
  const { mode } = useTheme();
  const [layers, setLayers] = React.useState({
    actividades: true,
    paneles: true,
    votantes: true,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };
  return (
    <div className="rounded-3xl bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Mapa territorial
          </p>
          <p className="text-sm font-semibold text-foreground">
            Actividades, paneles y votantes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {(
            [
              { key: "actividades", label: "Actividades", color: "bg-emerald-500" },
              { key: "paneles", label: "Paneles", color: "bg-sky-500" },
              { key: "votantes", label: "Votantes", color: "bg-orange-500" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleLayer(item.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                layers[item.key]
                  ? "border-transparent bg-foreground/5 text-foreground"
                  : "border-border/30 bg-transparent text-muted-foreground"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <MapPanel
        height={420}
        status={error ? "error" : undefined}
        className="border-transparent shadow-none bg-transparent"
      >
        {data?.departamentos ? (
          <Source id="guillermo-departamentos" type="geojson" data={data.departamentos as any}>
            <Layer
              id="guillermo-departamentos-fill"
              type="fill"
              paint={{
                "fill-color": mode === "dark" ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.08)",
                "fill-opacity": 0.9,
              }}
            />
            <Layer
              id="guillermo-departamentos-line"
              type="line"
              paint={{
                "line-color": mode === "dark" ? "rgba(226,232,240,0.5)" : "rgba(15,23,42,0.35)",
                "line-width": 1.1,
              }}
            />
          </Source>
        ) : null}
        {data?.actividades && layers.actividades ? (
          <Source id="guillermo-actividades" type="geojson" data={data.actividades as any}>
            <Layer
              id="guillermo-actividades-circle"
              type="circle"
              paint={{
                "circle-radius": 4,
                "circle-color": "#22c55e",
                "circle-opacity": 0.75,
              }}
            />
          </Source>
        ) : null}
        {data?.paneles && layers.paneles ? (
          <Source id="guillermo-paneles" type="geojson" data={data.paneles as any}>
            <Layer
              id="guillermo-paneles-circle"
              type="circle"
              paint={{
                "circle-radius": 4,
                "circle-color": "#38bdf8",
                "circle-opacity": 0.75,
              }}
            />
          </Source>
        ) : null}
        {data?.votantes && layers.votantes ? (
          <Source id="guillermo-votantes" type="geojson" data={data.votantes as any}>
            <Layer
              id="guillermo-votantes-circle"
              type="circle"
              paint={{
                "circle-radius": 4,
                "circle-color": "#f97316",
                "circle-opacity": 0.75,
              }}
            />
          </Source>
        ) : null}
      </MapPanel>
    </div>
  );
}
