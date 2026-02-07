"use client";

import * as React from "react";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import { GripVertical, Upload, Trash2, X, Plus, Minus } from "lucide-react";

type GeojsonLayerType = "departamento" | "provincia" | "distrito" | "nivel4";

type DashboardFileSpec = {
  id: string;
  label: string;
  accept?: string;
  hint: string;
  optional?: boolean;
  layerType?: GeojsonLayerType;
};

type DashboardItem = {
  id: string;
  label: string;
  description: string;
  files: DashboardFileSpec[];
};

type GeojsonLayerInfo = { fileName: string | null; updatedAt: string | null };
type GeojsonInfoState = Record<GeojsonLayerType, GeojsonLayerInfo>;

type CampaignConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName?: string | null;
  campaignRegion?: string | null;
  activeDashboard: DashboardItem | null;
  isAdmin: boolean;
  isSaving: boolean;
  saveError: string | null;
  uploads: Record<string, File | null>;
  resolvedGeojsonInfo: GeojsonInfoState;
  onSave: () => void;
  onDeleteGeojson: (layerType: GeojsonLayerType) => void;
  onUploadChange: (uploadKey: string, file: File | null) => void;
};

function formatDateEsPE(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildUploadKey(args: {
  campaignId: string;
  dashboardId: string;
  fileSpecId: string;
  layerType?: GeojsonLayerType;
}) {
  const { campaignId, dashboardId, fileSpecId, layerType } = args;
  return layerType
    ? `${campaignId}-${dashboardId}-geojson-${layerType}`
    : `${campaignId}-${dashboardId}-${fileSpecId}`;
}

type RowItem = {
  kind: "geojson" | "asset";
  id: string; // stable id for selection/ordering
  fileSpec: DashboardFileSpec;
  uploadKey: string;
};

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        "inline-block h-2 w-2 rounded-full",
        ok ? "bg-emerald-500" : "bg-muted-foreground/35",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

const IconButton = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    size="sm"
    variant="ghost"
    className={["h-8 w-8 p-0", className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </Button>
);

export const CampaignConfigDialog = ({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  campaignRegion,
  activeDashboard,
  isAdmin,
  isSaving,
  saveError,
  uploads,
  resolvedGeojsonInfo,
  onSave,
  onDeleteGeojson,
  onUploadChange,
}: CampaignConfigDialogProps) => {
  const dashboard = activeDashboard;
  const disabledEdits = !isAdmin || isSaving;

  const items = React.useMemo<RowItem[]>(() => {
    if (!dashboard) return [];
    return dashboard.files.map((fileSpec) => {
      const uploadKey = buildUploadKey({
        campaignId,
        dashboardId: dashboard.id,
        fileSpecId: fileSpec.id,
        layerType: fileSpec.layerType,
      });
      const kind: RowItem["kind"] = fileSpec.layerType ? "geojson" : "asset";
      return {
        kind,
        id: `${kind}:${fileSpec.layerType ?? "x"}:${fileSpec.id}`,
        fileSpec,
        uploadKey,
      };
    });
  }, [dashboard, campaignId]);

  const levelItems = React.useMemo(
    () => items.filter((it) => it.kind === "geojson"),
    [items],
  );

  // Optional: allow user ordering like “budgets”.
  const [order, setOrder] = React.useState<string[]>([]);
  React.useEffect(() => {
    setOrder(items.map((it) => it.id));
  }, [items]);

  const orderedItems = React.useMemo(() => {
    const map = new Map(items.map((it) => [it.id, it]));
    return order.map((id) => map.get(id)).filter(Boolean) as RowItem[];
  }, [items, order]);

  const [visibleLevels, setVisibleLevels] = React.useState<string[]>([]);
  React.useEffect(() => {
    setVisibleLevels(levelItems.map((it) => it.id));
  }, [levelItems]);

  const orderedVisibleItems = React.useMemo(() => {
    const visible = new Set(visibleLevels);
    return orderedItems.filter(
      (it) => it.kind !== "geojson" || visible.has(it.id),
    );
  }, [orderedItems, visibleLevels]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeId && orderedVisibleItems.length) {
      setActiveId(orderedVisibleItems[0]!.id);
      return;
    }
    if (activeId && !orderedVisibleItems.some((it) => it.id === activeId)) {
      setActiveId(orderedVisibleItems[0]?.id ?? null);
    }
  }, [activeId, orderedVisibleItems]);

  const active = orderedVisibleItems.find((it) => it.id === activeId) ?? null;

  // Simple HTML5 drag reorder (minimalista, sin libs)
  const dragId = React.useRef<string | null>(null);
  function onDragStart(id: string) {
    dragId.current = id;
  }
  function onDrop(overId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === overId) return;
    setOrder((prev) => {
      const next = [...prev];
      const a = next.indexOf(from);
      const b = next.indexOf(overId);
      if (a === -1 || b === -1) return prev;
      next.splice(a, 1);
      next.splice(b, 0, from);
      return next;
    });
  }

  if (!dashboard) return <Dialog open={open} onOpenChange={onOpenChange} />;

  const geoCount = orderedVisibleItems.filter(
    (x) => x.kind === "geojson",
  ).length;
  const assetCount = orderedVisibleItems.filter(
    (x) => x.kind === "asset",
  ).length;
  const hiddenLevels = levelItems.filter(
    (it) => !visibleLevels.includes(it.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] w-[98vw] max-w-[98vw] gap-0 overflow-hidden p-0 sm:max-w-[96vw] md:h-[92vh] md:w-[96vw]">
        {/* Header */}
        <div className="relative border-b border-border/60 px-8 py-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.10),_transparent_55%)]" />
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-xl">{dashboard.label}</DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  {campaignName ?? "-"} · {campaignRegion ?? "-"}
                </DialogDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Gestión</Badge>
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin" : "Solo lectura"}
                </span>
              </div>
            </div>

            {saveError ? (
              <div className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-600 dark:text-rose-300">
                {saveError}
              </div>
            ) : null}
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="grid h-full grid-cols-1 gap-0 overflow-hidden md:grid-cols-[420px_1fr]">
          {/* Left list */}
          <div className="border-b border-border/60 bg-muted/10 md:border-b-0 md:border-r md:border-border/60">
            <div className="flex items-center justify-between gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              <span>
                Archivos · {geoCount ? `Mapa base (${geoCount})` : ""}
                {geoCount && assetCount ? " · " : ""}
                {assetCount ? `Recursos (${assetCount})` : ""}
              </span>

              {hiddenLevels.length > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 rounded-full px-3 text-[10px] uppercase tracking-[0.24em]"
                  onClick={() => {
                    const next = hiddenLevels[0];
                    if (!next) return;
                    setVisibleLevels((current) => [...current, next.id]);
                    setActiveId(next.id);
                  }}
                  disabled={disabledEdits}
                >
                  <Plus size={12} />
                  Agregar nivel
                </Button>
              ) : null}
            </div>

            <div className="overflow-auto">
              {orderedVisibleItems.length === 0 ? (
                <div className="px-6 py-6 text-sm text-muted-foreground">
                  Este dashboard no requiere archivos.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {orderedVisibleItems.map((it) => {
                    const { fileSpec, uploadKey, kind } = it;
                    const selected = uploads[uploadKey] ?? null;

                    const layerInfo = fileSpec.layerType
                      ? resolvedGeojsonInfo[fileSpec.layerType]
                      : null;

                    const hasBackend = Boolean(layerInfo?.fileName);
                    const ok =
                      Boolean(selected) ||
                      (kind === "geojson" ? hasBackend : false);

                    const isActive = it.id === activeId;

                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          draggable
                          onDragStart={() => onDragStart(it.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDrop(it.id)}
                          className={[
                            "group flex w-full items-center gap-2 px-6 py-2 text-left",
                            isActive ? "bg-muted/40" : "hover:bg-muted/20",
                          ].join(" ")}
                          onClick={() => setActiveId(it.id)}
                        >
                          <span className="invisible text-muted-foreground/60 group-hover:visible group-hover:text-muted-foreground">
                            <GripVertical size={16} />
                          </span>

                          <StatusDot ok={ok} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm text-foreground">
                                {fileSpec.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {fileSpec.optional ? "Opcional" : "Req."}
                              </span>
                              {kind === "geojson" ? (
                                <span className="text-[10px] text-muted-foreground">
                                  GeoJSON
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {selected?.name
                                ? `Seleccionado: ${selected.name}`
                                : kind === "geojson" && layerInfo?.fileName
                                  ? `Cargado: ${layerInfo.fileName}`
                                  : "Sin archivo"}
                            </div>
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            {kind === "geojson"
                              ? hasBackend
                                ? "OK"
                                : "—"
                              : selected
                                ? "OK"
                                : "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right details (ultra minimal) */}
          <div className="overflow-auto px-8 py-6">
            {!active ? (
              <div className="text-sm text-muted-foreground">
                Selecciona un item.
              </div>
            ) : (
              (() => {
                const { fileSpec, uploadKey, kind } = active;
                const selected = uploads[uploadKey] ?? null;

                const layerInfo = fileSpec.layerType
                  ? resolvedGeojsonInfo[fileSpec.layerType]
                  : null;

                const backendName = layerInfo?.fileName ?? null;
                const updated = formatDateEsPE(layerInfo?.updatedAt ?? null);

                const inputId = `file-${uploadKey}`;
                const accept = fileSpec.accept;

                const ok =
                  Boolean(selected?.name) ||
                  (kind === "geojson" && Boolean(backendName));

                const canRemoveLevel =
                  kind === "geojson" && !selected && !backendName;

                return (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground">
                            {fileSpec.label}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">
                            {fileSpec.optional ? "Opcional" : "Requerido"}
                          </span>
                          {accept ? (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {accept}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {fileSpec.hint}
                        </p>
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col gap-3 border-t border-border/60 pt-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <StatusDot ok={ok} />
                          <span className="text-foreground">
                            {selected?.name
                              ? "Listo para guardar"
                              : kind === "geojson" && backendName
                                ? "Cargado"
                                : "Sin archivo"}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="truncate font-mono text-[12px] text-muted-foreground">
                            {selected?.name ?? backendName ?? "—"}
                          </span>
                        </div>

                        {kind === "geojson" && updated ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Actualizado: {updated}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          id={inputId}
                          type="file"
                          accept={accept}
                          disabled={disabledEdits}
                          className="sr-only"
                          onChange={(e) =>
                            onUploadChange(
                              uploadKey,
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={disabledEdits}
                          onClick={() => {
                            const el = document.getElementById(
                              inputId,
                            ) as HTMLInputElement | null;
                            el?.click();
                          }}
                        >
                          <Upload size={16} className="mr-2" />
                          {selected ? "Reemplazar" : "Elegir"}
                        </Button>

                        <IconButton
                          disabled={disabledEdits || !selected}
                          onClick={() => onUploadChange(uploadKey, null)}
                          aria-label="Quitar archivo seleccionado"
                          title="Quitar"
                        >
                          <X size={16} />
                        </IconButton>

                        {canRemoveLevel ? (
                          <IconButton
                            disabled={disabledEdits}
                            onClick={() => {
                              setVisibleLevels((current) =>
                                current.filter((id) => id !== active.id),
                              );
                            }}
                            aria-label="Quitar nivel"
                            title="Quitar nivel"
                          >
                            <Minus size={16} />
                          </IconButton>
                        ) : null}

                        {kind === "geojson" ? (
                          <IconButton
                            disabled={
                              disabledEdits ||
                              !fileSpec.layerType ||
                              !backendName
                            }
                            onClick={() => {
                              if (!fileSpec.layerType) return;
                              onDeleteGeojson(fileSpec.layerType);
                            }}
                            aria-label="Eliminar GeoJSON cargado"
                            title="Eliminar cargado"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        ) : null}
                      </div>
                    </div>

                    {!isAdmin ? (
                      <p className="text-xs text-muted-foreground">
                        Solo admin puede cargar archivos y guardar cambios.
                      </p>
                    ) : null}
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/10 px-8 py-5">
          <div className="text-xs text-muted-foreground">
            Arrastra para reordenar. Selecciona un item para editar.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cerrar
            </Button>
            <Button disabled={!isAdmin || isSaving} onClick={onSave}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
