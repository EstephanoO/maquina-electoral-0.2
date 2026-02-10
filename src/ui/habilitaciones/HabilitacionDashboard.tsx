"use client";

import * as React from "react";
import type { MapRef } from "@vis.gl/react-maplibre";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { PeruMapPanel } from "@/ui/maps/PeruMapPanel";
import { useOperators } from "@/habilitaciones/hooks/useOperators";
import { useFormMapPoints } from "@/habilitaciones/hooks/useFormMapPoints";
import { enableFormAccess } from "@/habilitaciones/services/formsAccessApi";
import type { FormMapPoint } from "@/habilitaciones/types";
import { OperatorPicker } from "@/ui/habilitaciones/OperatorPicker";

const DEFAULT_MESSAGE =
  "Selecciona puntos en el mapa para habilitar contactos a operadoras.";

export default function HabilitacionDashboard() {
  const mapRef = React.useRef<MapRef | null>(null);
  const { operators, isLoading: operatorsLoading, error: operatorsError } = useOperators();
  const { points, isLoading: pointsLoading, error: pointsError } = useFormMapPoints();
  const [selectedOperatorIds, setSelectedOperatorIds] = React.useState<string[]>([]);
  const [selectedPoints, setSelectedPoints] = React.useState<FormMapPoint[]>([]);
  const [search, setSearch] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);

  const filteredPoints = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return points;
    return points.filter((point) => {
      return [point.name, point.phone, point.candidate, point.interviewer]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [points, search]);

  const mapPoints = React.useMemo(
    () =>
      filteredPoints.map((point) => ({
        lat: point.latitude,
        lng: point.longitude,
        candidate: point.candidate,
        interviewer: point.interviewer,
        name: point.name,
        phone: point.phone,
        createdAt: point.createdAt ?? undefined,
        kind: "interview" as const,
        id: point.id,
        clientId: point.clientId,
      })),
    [filteredPoints],
  );

  const handleBoxSelect = React.useCallback(
    (selected: Array<{ id?: string | null }>) => {
      const selectedIds = new Set(
        selected.map((item) => item.id).filter((value): value is string => Boolean(value)),
      );
      const next = filteredPoints.filter((point) => selectedIds.has(point.id));
      setSelectedPoints(next);
    },
    [filteredPoints],
  );

  const handleEnable = React.useCallback(async () => {
    if (!selectedOperatorIds.length || !selectedPoints.length) return;
    setSaving(true);
    try {
      await enableFormAccess({
        operatorIds: selectedOperatorIds,
        formIds: selectedPoints.map((point) => point.id),
        enabledBy: "public",
      });
      setMessage("Accesos habilitados correctamente.");
      setSelectedPoints([]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo habilitar.");
    } finally {
      setSaving(false);
    }
  }, [selectedOperatorIds, selectedPoints]);

  const statusLabel = pointsLoading
    ? "Cargando puntos"
    : pointsError
      ? "Error al cargar"
      : "Lista de puntos";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
      <header className="panel-elevated fade-rise border-b border-border/60 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#163960] p-2">
              <img
                src="/isotipo(2).jpg"
                alt="GOBERNA"
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Habilitaciones
              </p>
              <h1 className="heading-display text-2xl font-semibold text-foreground md:text-3xl">
                Seleccion de contactos
              </h1>
              <p className="text-sm text-muted-foreground">Ruta publica de prueba</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-[#163960]/10 text-[#163960]">
              {filteredPoints.length} contactos
            </Badge>
            <Badge variant="secondary" className="bg-[#FFC800]/20 text-[#7a5b00]">
              {selectedPoints.length} seleccionados
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-6 pt-6 md:px-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 px-4 py-4 shadow-lg shadow-black/5 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[260px] flex-1">
              <label
                htmlFor="record-search"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
              >
                Buscar contacto
              </label>
              <Input
                id="record-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, telefono o entrevistador"
                className="mt-2 h-11 rounded-2xl border-border/60 bg-card/70"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60 text-foreground">
                {statusLabel}
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{message}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="panel fade-rise rounded-3xl border border-border/70 px-4 py-4 md:px-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="heading-display text-xl font-semibold">Mapa de contactos</h2>
                <p className="text-sm text-muted-foreground">
                  Arrastra un recuadro para seleccionar puntos.
                </p>
              </div>
            </div>
            <div className="h-[520px] overflow-hidden rounded-2xl border border-border/60">
              <PeruMapPanel
                className="h-full w-full"
                points={mapPoints}
                mapRef={mapRef}
                status={pointsLoading ? "loading" : pointsError ? "error" : undefined}
                statusLabel="Sin puntos"
                enableHierarchy={false}
                showHierarchyControls={false}
                enablePointTooltip
                enableBoxSelect
                onBoxSelect={handleBoxSelect}
                renderPointTooltip={(point) => (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-foreground">{point.name}</p>
                    <p className="text-muted-foreground">{point.phone}</p>
                    {point.interviewer ? (
                      <p className="text-muted-foreground">{point.interviewer}</p>
                    ) : null}
                  </div>
                )}
              />
            </div>
          </section>

          <aside className="space-y-4">
            <section className="panel fade-rise rounded-3xl border border-border/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Operadoras
              </h3>
              <div className="mt-3">
                {operatorsLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando operadoras...</p>
                ) : operatorsError ? (
                  <p className="text-sm text-red-500">No se pudo cargar operadoras.</p>
                ) : (
                  <OperatorPicker
                    operators={operators}
                    selected={selectedOperatorIds}
                    onChange={setSelectedOperatorIds}
                  />
                )}
              </div>
            </section>

            <section className="panel fade-rise rounded-3xl border border-border/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Seleccion actual
              </h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>{selectedPoints.length} contactos seleccionados.</p>
                <p>{selectedOperatorIds.length} operadoras marcadas.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={saving || !selectedPoints.length || !selectedOperatorIds.length}
                >
                  {saving ? "Habilitando..." : "Habilitar seleccion"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPoints([])}
                  disabled={!selectedPoints.length}
                >
                  Limpiar seleccion
                </Button>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
