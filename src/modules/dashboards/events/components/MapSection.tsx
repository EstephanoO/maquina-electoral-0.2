import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeruMapPanel } from "@/modules/maps/PeruMapPanel";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { MapPoint } from "../utils/dataUtils";

interface MapSectionProps {
  points: MapPoint[];
  candidateLabels: string[];
  mapStatus: "loading" | "error" | "empty" | undefined;
  mapRef: React.MutableRefObject<MapRef | null>;
  resetMapView: (() => void) | null;
  setResetMapView: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  withLocation: number;
  showLegend?: boolean;
}

export const MapSection: React.FC<MapSectionProps> = ({
  points,
  candidateLabels,
  mapStatus,
  mapRef,
  resetMapView,
  setResetMapView,
  withLocation,
  showLegend = true,
}) => {
  const [showStreetBase, setShowStreetBase] = React.useState(true);
  const getPointColor = React.useCallback((point: MapPoint) => {
    if (point.candidate === candidateLabels[0]) return "#10b981";
    if (point.candidate === candidateLabels[1]) return "#3b82f6";
    if (point.candidate === candidateLabels[2]) return "#f97316";
    return "#64748b";
  }, [candidateLabels]);

  return (
    <div className="relative h-[70vh] min-h-[520px] rounded-2xl border border-border/60 bg-card/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,_rgba(15,23,42,0.12),_transparent_35%)] dark:bg-[linear-gradient(180deg,_rgba(2,6,23,0.45),_transparent_35%)]" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowStreetBase((value) => !value)}
          className="bg-background/80 backdrop-blur"
        >
          {showStreetBase ? "Ocultar fondo" : "Mostrar fondo"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (resetMapView) {
              resetMapView();
              return;
            }
            mapRef.current?.flyTo({
              center: [-75.02, -9.19],
              zoom: 5.2,
              essential: true,
            });
          }}
          className="bg-background/80 backdrop-blur"
        >
          Centrar Peru
        </Button>
      </div>
      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-border/60 bg-background/75 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
        <p className="font-semibold text-foreground">Mapa Peru</p>
        <p>{withLocation} puntos activos</p>
      </div>
      {showLegend ? (
        <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Leyenda
          </p>
          <div className="mt-2 space-y-1">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {candidateLabels[0]}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {candidateLabels[1]}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {candidateLabels[2]}
            </span>
          </div>
        </div>
      ) : null}
      <PeruMapPanel
        height={null}
        className="h-full w-full rounded-2xl"
        points={points}
        status={mapStatus}
        mapRef={mapRef}
        onResetViewReady={setResetMapView}
        useStreetBase={showStreetBase}
        restrictToPeru
        enablePointTooltip
        renderPointTooltip={(point) => (
          <div className="space-y-2 rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-100 shadow-lg">
            <div className="space-y-1">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                Entrevistado
              </p>
              <p className="text-sm font-semibold text-white">
                {point.name ?? "-"}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                  WhatsApp
                </p>
                <p className="text-xs text-white">{point.phone ?? "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
                  Hora
                </p>
                <p className="text-xs text-white">
                  {point.createdAt
                    ? new Date(point.createdAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        )}
        getPointColor={getPointColor}
      />
    </div>
  );
};
