"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CampaignConfigDialog } from "@/modules/console/CampaignConfigDialog";
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
  layerType?: GeojsonLayerType;
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

type GeojsonLayerType = "departamento" | "provincia" | "distrito" | "nivel4";
type GeojsonLayerInfo = { fileName: string | null; updatedAt: string | null };
type GeojsonInfoState = Record<GeojsonLayerType, GeojsonLayerInfo>;

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

const resolveNivel4Hint = (campaignId: string, slug: string) =>
  campaignId === "cand-giovanna"
    ? "/public/geo/nieto_giovanna.geojson"
    : `/public/${slug}/mapa-${slug}/nivel-4.geojson`;

const buildGeojsonSpecs = (campaignId: string, slug: string): DashboardFileSpec[] => [
  {
    id: "geojson-nivel-1",
    label: "Nivel 1",
    accept: ".geojson,.json",
    hint: `/public/${slug}/mapa-${slug}/nivel-1.geojson`,
    optional: true,
    layerType: "departamento",
  },
  {
    id: "geojson-nivel-2",
    label: "Nivel 2",
    accept: ".geojson,.json",
    hint: `/public/${slug}/mapa-${slug}/nivel-2.geojson`,
    optional: true,
    layerType: "provincia",
  },
  {
    id: "geojson-nivel-3",
    label: "Nivel 3",
    accept: ".geojson,.json",
    hint: `/public/${slug}/mapa-${slug}/nivel-3.geojson`,
    optional: true,
    layerType: "distrito",
  },
  {
    id: "geojson-nivel-4",
    label: "Nivel 4",
    accept: ".geojson,.json",
    hint: resolveNivel4Hint(campaignId, slug),
    optional: true,
    layerType: "nivel4",
  },
];

const buildDashboards = (campaignId: string): DashboardItem[] => {
  const slug = candidateSlugById[campaignId] ?? "cliente";
  const eventId = eventByCampaignId[campaignId] ?? "event";
  const includeGeojsonInAnalytics = campaignId !== "cand-guillermo";
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
    ...(includeGeojsonInAnalytics ? buildGeojsonSpecs(campaignId, slug) : []),
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
        ...buildGeojsonSpecs(campaignId, slug),
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
  const [geojsonInfo, setGeojsonInfo] = React.useState<GeojsonInfoState | null>(null);
  const autoNivel4AppliedRef = React.useRef(false);

  const dashboards = buildDashboards(campaignId);
  const geojsonLayerIds: GeojsonLayerType[] = ["departamento", "provincia", "distrito", "nivel4"];
  const emptyGeojsonInfo = React.useMemo<GeojsonInfoState>(
    () => ({
      departamento: { fileName: null, updatedAt: null },
      provincia: { fileName: null, updatedAt: null },
      distrito: { fileName: null, updatedAt: null },
      nivel4: { fileName: null, updatedAt: null },
    }),
    [],
  );
  const resolvedGeojsonInfo = geojsonInfo ?? emptyGeojsonInfo;

  React.useEffect(() => {
    if (!dialogOpen || !activeDashboard || activeDashboard.id !== "tierra") return;
    let active = true;
    const load = async () => {
      const response = await fetch(`/api/geojson?campaignId=${campaignId}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        layers?: Record<GeojsonLayerType, { fileName: string | null; updatedAt: string | null } | null>;
      };
      if (!active) return;
      setGeojsonInfo({
        departamento: payload.layers?.departamento
          ? {
              fileName: payload.layers.departamento.fileName,
              updatedAt: payload.layers.departamento.updatedAt,
            }
          : emptyGeojsonInfo.departamento,
        provincia: payload.layers?.provincia
          ? {
              fileName: payload.layers.provincia.fileName,
              updatedAt: payload.layers.provincia.updatedAt,
            }
          : emptyGeojsonInfo.provincia,
        distrito: payload.layers?.distrito
          ? {
              fileName: payload.layers.distrito.fileName,
              updatedAt: payload.layers.distrito.updatedAt,
            }
          : emptyGeojsonInfo.distrito,
        nivel4: payload.layers?.nivel4
          ? {
              fileName: payload.layers.nivel4.fileName,
              updatedAt: payload.layers.nivel4.updatedAt,
            }
          : emptyGeojsonInfo.nivel4,
      });
    };
    load();
    return () => {
      active = false;
    };
  }, [campaignId, dialogOpen, activeDashboard, emptyGeojsonInfo]);

  React.useEffect(() => {
    if (!isAdmin) return;
    if (!dialogOpen || !activeDashboard || activeDashboard.id !== "tierra") return;
    if (campaignId !== "cand-giovanna") return;
    if (!geojsonInfo) return;
    if (autoNivel4AppliedRef.current) return;
    if (geojsonInfo.nivel4?.fileName) {
      autoNivel4AppliedRef.current = true;
      return;
    }

    const applyNivel4 = async () => {
      try {
        const response = await fetch("/geo/nieto_giovanna.geojson", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        await fetch("/api/geojson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            layerType: "nivel4",
            geojson: payload,
            fileName: "nieto_giovanna.geojson",
          }),
        });
        setGeojsonInfo((current) => ({
          ...(current ?? emptyGeojsonInfo),
          nivel4: { fileName: "nieto_giovanna.geojson", updatedAt: new Date().toISOString() },
        }));
      } catch (error) {
        // noop
      } finally {
        autoNivel4AppliedRef.current = true;
      }
    };

    applyNivel4();
  }, [
    activeDashboard,
    campaignId,
    dialogOpen,
    emptyGeojsonInfo,
    geojsonInfo,
    isAdmin,
  ]);

  const handleSave = async () => {
    if (!activeDashboard || !isAdmin) {
      setDialogOpen(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const newInfo: GeojsonInfoState = { ...(geojsonInfo ?? emptyGeojsonInfo) };
      for (const layerType of geojsonLayerIds) {
        const geojsonKey = `${campaignId}-${activeDashboard.id}-geojson-${layerType}`;
        const geojsonFile = uploads[geojsonKey];
        if (!geojsonFile) continue;
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
            layerType,
            geojson: payload,
            fileName: geojsonFile.name,
          }),
        });
        if (!response.ok) {
          throw new Error("upload-failed");
        }
        newInfo[layerType] = { fileName: geojsonFile.name, updatedAt: new Date().toISOString() };
      }
      setGeojsonInfo({ ...newInfo });

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

  const handleDeleteGeojson = async (layerType: GeojsonLayerType) => {
    if (!isAdmin) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `/api/geojson?campaignId=${campaignId}&layerType=${layerType}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        throw new Error("delete-failed");
      }
      setGeojsonInfo((current) => ({
        ...(current ?? emptyGeojsonInfo),
        [layerType]: { fileName: null, updatedAt: null },
      }));
      setUploads((current) => ({
        ...current,
        [`${campaignId}-${activeDashboard?.id ?? "tierra"}-geojson-${layerType}`]: null,
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
                      <Link href={isAdmin ? `${dashboard.href}?preview=1` : dashboard.href}>Entrar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <CampaignConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        campaignName={campaign?.name}
        campaignRegion={campaign?.region}
        activeDashboard={activeDashboard}
        isAdmin={isAdmin}
        isSaving={isSaving}
        saveError={saveError}
        uploads={uploads}
        resolvedGeojsonInfo={resolvedGeojsonInfo}
        onSave={handleSave}
        onDeleteGeojson={handleDeleteGeojson}
        onUploadChange={(uploadKey, file) =>
          setUploads((current) => ({
            ...current,
            [uploadKey]: file,
          }))
        }
      />
    </RoleGate>
  );
}
