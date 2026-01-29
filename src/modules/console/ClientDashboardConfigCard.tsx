"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { campaigns } from "@/db/constants";

type DashboardFileSpec = {
  id: string;
  label: string;
  accept?: string;
  hint: string;
  optional?: boolean;
};

type DashboardConfig = {
  id: string;
  label: string;
  description: string;
  files: DashboardFileSpec[];
};

const clientSlugs: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

const resolvePhotoHint = (slug: string) =>
  slug === "guillermo" ? "/public/2guillermo.jpg" : `/public/${slug}/candidato.jpg`;

const getDashboardConfigs = (slug: string): DashboardConfig[] => [
  {
    id: "tierra",
    label: "Dashboard Tierra",
    description: "Recoleccion de datos y operaciones en territorio.",
    files: [
      {
        id: "interviews",
        label: "Registros de entrevistas (CSV)",
        accept: ".csv",
        hint: "Carga manual para reemplazar la data en vivo.",
        optional: true,
      },
      {
        id: "geojson",
        label: "GeoJSON base del cliente",
        accept: ".geojson,.json",
        hint: "Se aplica al mapa del cliente en el dashboard.",
        optional: true,
      },
    ],
  },
  {
    id: "analytics",
    label: "Dashboard Analytics",
    description: "Informe digital y performance de campana.",
    files: [
      {
        id: "panorama",
        label: "Informe panoramico (CSV)",
        accept: ".csv",
        hint: `/public/${slug}/Informe_panoramico.csv`,
      },
      {
        id: "facebook",
        label: "Dataset Facebook (JSON)",
        accept: ".json",
        hint: `/public/${slug}/dataset_facebook-posts.json`,
      },
      {
        id: "geojson",
        label: "Mapas GeoJSON",
        accept: ".geojson,.zip",
        hint: `/public/${slug}/mapa-${slug}/*.geojson`,
      },
      {
        id: "landings",
        label: "Landings / Campanas (XLSX o CSV)",
        accept: ".xlsx,.csv",
        hint: `/public/${slug}/Landings.xlsx`,
      },
      {
        id: "photo",
        label: "Foto del candidato",
        accept: "image/*",
        hint: resolvePhotoHint(slug),
        optional: true,
      },
    ],
  },
];

export const ClientDashboardConfigCard = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeConfig, setActiveConfig] = React.useState<{
    clientId: string;
    clientName: string;
    dashboard: DashboardConfig;
  } | null>(null);
  const [uploads, setUploads] = React.useState<Record<string, File | null>>({});

  const openConfig = (clientId: string, clientName: string, dashboard: DashboardConfig) => {
    setActiveConfig({ clientId, clientName, dashboard });
    setDialogOpen(true);
  };

  const updateUpload = (key: string, file: File | null) => {
    setUploads((current) => ({ ...current, [key]: file }));
  };

  const handleSave = async () => {
    if (!activeConfig) {
      setDialogOpen(false);
      return;
    }

    const baseKey = `${activeConfig.clientId}-${activeConfig.dashboard.id}`;
    const geojsonKey = `${baseKey}-geojson`;
    const geojsonFile = uploads[geojsonKey];

    if (geojsonFile) {
      const raw = await geojsonFile.text();
      let payload: unknown = null;
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        setDialogOpen(false);
        return;
      }

      await fetch("/api/geojson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: activeConfig.clientId,
          layerType: "departamento",
          geojson: payload,
          fileName: geojsonFile.name,
        }),
      });
    }

    setDialogOpen(false);
  };

  return (
    <Card className="panel fade-rise card-hover p-6 stagger-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gestion de dashboards
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Clientes y configuracion</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Solo admin puede cargar archivos para actualizar cada dashboard.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {campaigns.map((campaign) => {
          const slug = clientSlugs[campaign.id] ?? campaign.name.toLowerCase();
          const dashboards = getDashboardConfigs(slug);
          return (
            <div
              key={campaign.id}
              className="rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-lg font-semibold text-foreground">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground">{campaign.region}</p>
                </div>
                <span className="rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
                  {campaign.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {dashboards.map((dashboard) => (
                  <div
                    key={`${campaign.id}-${dashboard.id}`}
                    className="rounded-2xl border border-border/60 bg-card/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{dashboard.label}</p>
                        <p className="text-xs text-muted-foreground">{dashboard.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConfig(campaign.id, campaign.name, dashboard)}
                      >
                        Configurar
                      </Button>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Archivos requeridos: {dashboard.files.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {activeConfig ? (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{activeConfig.dashboard.label}</DialogTitle>
              <DialogDescription>
                {activeConfig.clientName} · {activeConfig.dashboard.description}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-lg font-semibold text-foreground">{activeConfig.clientName}</p>
                  <p className="text-xs text-muted-foreground">{activeConfig.dashboard.description}</p>
                </div>
                <span className="rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
                  Gestion
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              {activeConfig.dashboard.files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                  Este dashboard no requiere archivos.
                </div>
              ) : (
                activeConfig.dashboard.files.map((fileSpec) => {
                  const key = `${activeConfig.clientId}-${activeConfig.dashboard.id}-${fileSpec.id}`;
                  const uploaded = uploads[key];
                  return (
                    <div
                      key={fileSpec.id}
                      className="relative overflow-hidden rounded-2xl border border-border/40 bg-white p-4 shadow-sm"
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 via-sky-400 to-indigo-400" />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="pl-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{fileSpec.label}</p>
                            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
                              {fileSpec.optional ? "Opcional" : "Requerido"}
                            </span>
                            {fileSpec.accept ? (
                              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                {fileSpec.accept}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{fileSpec.hint}</p>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                          <input
                            type="file"
                            accept={fileSpec.accept}
                            onChange={(event) =>
                              updateUpload(key, event.target.files?.[0] ?? null)
                            }
                            className="sr-only"
                          />
                          Subir archivo
                        </label>
                      </div>
                      {uploaded ? (
                        <p className="mt-3 text-xs text-foreground">
                          Archivo seleccionado: {uploaded.name}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">Sin archivo cargado.</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
              <Button onClick={handleSave}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </Card>
  );
};
