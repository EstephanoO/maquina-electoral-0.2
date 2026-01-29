"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { campaigns } from "@/db/constants";
import { RoleGate } from "@/modules/shared/RoleGate";
import { EmptyState } from "@/modules/shared/EmptyState";
import { useSessionStore } from "@/stores/session.store";

type DashboardFileSpec = {
  id: string;
  label: string;
  accept?: string;
  hint: string;
  optional?: boolean;
};

type DashboardItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  status: "disponible" | "pendiente";
  files: DashboardFileSpec[];
  accent: string;
};

const candidateSlugById: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

const eventByCampaignId: Record<string, string> = {
  "cand-rocio": "event-rocio-01",
  "cand-giovanna": "event-giovanna-01",
  "cand-guillermo": "event-guillermo-01",
};

const buildDashboards = (campaignId: string): DashboardItem[] => {
  const slug = candidateSlugById[campaignId] ?? "cliente";
  const eventId = eventByCampaignId[campaignId] ?? "event"
  const sharedFiles: DashboardFileSpec[] = [
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
      hint: `/public/${slug}/candidato.jpg`,
      optional: true,
    },
  ];

  return [
    {
      id: "tierra",
      label: "Dashboard Tierra",
      description: "Recoleccion de datos y operaciones en territorio.",
      href: `/dashboard/${slug}/tierra/${eventId}`,
      status: "disponible",
      files: [
        {
          id: "interviews",
          label: "Registros de entrevistas (CSV)",
          accept: ".csv",
          hint: "Carga manual para reemplazar data de campo.",
          optional: true,
        },
        {
          id: "geojson",
          label: "GeoJSON base del cliente",
          accept: ".geojson,.json",
          hint: "Se aplica al mapa del cliente en el dashboard tierra.",
          optional: true,
        },
      ],
      accent: "from-emerald-400/30 via-sky-300/20 to-transparent",
    },
    {
      id: "analytics",
      label: "Dashboard Analytics",
      description: "Panorama digital y performance de campana.",
      href: `/dashboard/${slug}/analytics`,
      status: "pendiente",
      files: sharedFiles,
      accent: "from-indigo-400/25 via-amber-300/20 to-transparent",
    },
  ];
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const campaign = campaigns.find((item) => item.id === campaignId);
  const role = useSessionStore((state) => state.currentRole);
  const isAdmin = role === "SUPER_ADMIN";
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeDashboard, setActiveDashboard] = React.useState<DashboardItem | null>(null);
  const [uploads, setUploads] = React.useState<Record<string, File | null>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [geojsonInfo, setGeojsonInfo] = React.useState<{
    fileName: string | null;
    updatedAt: string | null;
  } | null>(null);

  const dashboards = buildDashboards(campaignId);

  React.useEffect(() => {
    if (!dialogOpen || !activeDashboard || activeDashboard.id !== "tierra") return;
    let active = true;
    const load = async () => {
      const response = await fetch(`/api/geojson?campaignId=${campaignId}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        fileName: string | null;
        updatedAt: string | null;
      };
      if (!active) return;
      setGeojsonInfo({ fileName: payload.fileName, updatedAt: payload.updatedAt });
    };
    load();
    return () => {
      active = false;
    };
  }, [campaignId, dialogOpen, activeDashboard]);

  const handleSave = async () => {
    if (!activeDashboard || !isAdmin) {
      setDialogOpen(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const geojsonKey = `${campaignId}-${activeDashboard.id}-geojson`;
      const geojsonFile = uploads[geojsonKey];

      if (geojsonFile) {
        if (geojsonFile.size > 10 * 1024 * 1024) {
          throw new Error("file-too-large");
        }
        const raw = await geojsonFile.text();
        const payload = JSON.parse(raw) as { type?: string; features?: unknown[] };
        if (payload?.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
          throw new Error("invalid-geojson");
        }
        const response = await fetch("/api/geojson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaignId,
            geojson: payload,
            fileName: geojsonFile.name,
          }),
        });
        if (!response.ok) {
          throw new Error("upload-failed");
        }
        setGeojsonInfo({ fileName: geojsonFile.name, updatedAt: new Date().toISOString() });
      }

      setDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "file-too-large"
          ? "El GeoJSON supera 10MB. Reduce el tamano del archivo."
          : error instanceof Error && error.message === "invalid-geojson"
            ? "El archivo no es un GeoJSON valido."
            : "No se pudo guardar el GeoJSON. Revisa el archivo.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGeojson = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/geojson?campaignId=${campaignId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("delete-failed");
      }
      setGeojsonInfo({ fileName: null, updatedAt: null });
      setUploads((current) => ({
        ...current,
        [`${campaignId}-${activeDashboard?.id ?? "tierra"}-geojson`]: null,
      }));
    } catch (error) {
      setSaveError("No se pudo eliminar el GeoJSON.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RoleGate action="manage" subject="campaign">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Dashboards de clientes
              </p>
              <h2 className="text-2xl font-semibold text-foreground">{campaign?.name ?? "-"}</h2>
              <p className="text-sm text-muted-foreground">{campaign?.region ?? "-"}</p>
            </div>
            <Badge variant="outline">Gestion</Badge>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="panel fade-rise card-hover p-5">
              <div className="relative overflow-hidden rounded-3xl bg-background/80 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-border/20">
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${dashboard.accent}`} />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/70">
                      {dashboard.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        dashboard.status === "disponible"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {dashboard.status === "disponible" ? "Disponible" : "Pendiente"}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{dashboard.label}</p>
                    <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border/20">
                    <div className="map-grid h-28 w-full rounded-xl" />
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Vista previa</span>
                      <span className="font-semibold text-foreground">Entrar</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveDashboard(dashboard);
                        setDialogOpen(true);
                      }}
                    >
                      Configurar
                    </Button>
                    <Button asChild>
                      <Link href={dashboard.href}>Entrar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {activeDashboard ? (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{activeDashboard.label}</DialogTitle>
              <DialogDescription>
                Archivos necesarios para actualizar este dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-lg font-semibold text-foreground">{campaign?.name ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">{campaign?.region ?? "-"}</p>
                </div>
                <Badge variant="outline">Gestion</Badge>
              </div>
            </div>
            <div className="grid gap-3">
              {activeDashboard.files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                  Este dashboard no requiere archivos.
                </div>
              ) : (
                activeDashboard.files.map((fileSpec) => {
                  const key = `${campaignId}-${activeDashboard.id}-${fileSpec.id}`;
                  const uploaded = uploads[key];
                  const isGeojson = fileSpec.id === "geojson";
                  const geojsonUpdatedLabel = geojsonInfo?.updatedAt
                    ? new Date(geojsonInfo.updatedAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                  return (
                    <div
                      key={fileSpec.id}
                      className={`relative overflow-hidden rounded-2xl border border-border/40 bg-white p-4 shadow-sm ${
                        isGeojson ? "bg-gradient-to-br from-white via-slate-50 to-white" : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${
                          isGeojson
                            ? "from-rose-400 via-amber-300 to-sky-400"
                            : "from-emerald-400 via-sky-400 to-indigo-400"
                        }`}
                      />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="pl-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {fileSpec.label}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {fileSpec.optional ? "Opcional" : "Requerido"}
                            </Badge>
                            {fileSpec.accept ? (
                              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                {fileSpec.accept}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{fileSpec.hint}</p>
                          {isGeojson ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                                {geojsonInfo?.fileName ? "Cargado" : "Sin GeoJSON"}
                              </span>
                              {geojsonInfo?.fileName ? (
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                                  {geojsonInfo.fileName}
                                </span>
                              ) : null}
                              {geojsonUpdatedLabel ? (
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                                  Actualizado: {geojsonUpdatedLabel}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                          <input
                            type="file"
                            accept={fileSpec.accept}
                            disabled={!isAdmin}
                            onChange={(event) =>
                              setUploads((current) => ({
                                ...current,
                                [key]: event.target.files?.[0] ?? null,
                              }))
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
                        <p className="mt-3 text-xs text-muted-foreground">
                          Sin archivo cargado.
                        </p>
                      )}
                      {isGeojson ? (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isAdmin || isSaving || !geojsonInfo?.fileName}
                            onClick={handleDeleteGeojson}
                          >
                            Eliminar GeoJSON
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
              <Button disabled={!isAdmin || isSaving} onClick={handleSave}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
            {saveError ? (
              <p className="text-xs text-rose-500">{saveError}</p>
            ) : null}
            {!isAdmin ? (
              <p className="text-xs text-muted-foreground">
                Solo admin puede cargar archivos y guardar cambios.
              </p>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </RoleGate>
  );
}
