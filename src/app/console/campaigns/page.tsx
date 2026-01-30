"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { useSessionStore } from "@/stores/session.store";
import { EmptyState } from "@/modules/shared/EmptyState";
import { RoleGate } from "@/modules/shared/RoleGate";
import { MoreHorizontal } from "lucide-react";

const fallbackProfile = {
  image: "/2guillermo.jpg",
  goal: "-",
  party: "",
  role: "",
  number: "",
};

export default function CampaignsPage() {
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const searchQuery = useCampaignsStore((state) => state.searchQuery);
  const searchCampaigns = useCampaignsStore((state) => state.searchCampaigns);
  const dashboardsByCampaign = useCampaignsStore((state) => state.dashboardsByCampaign);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const updateCampaignStatus = useCampaignsStore((state) => state.updateCampaignStatus);
  const removeCampaign = useCampaignsStore((state) => state.removeCampaign);
  const updateCampaign = useCampaignsStore((state) => state.updateCampaign);
  const updateCampaignProfile = useCampaignsStore((state) => state.updateCampaignProfile);
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const assignedCampaignIds = useSessionStore((state) => state.assignedCampaignIds);
  const role = useSessionStore((state) => state.currentRole);
  const [editCampaignId, setEditCampaignId] = React.useState<string | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: "",
    region: "",
    party: "",
    role: "",
    number: "",
    goal: "",
    image: "",
  });
  const matchingCampaigns = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return campaigns;
    }
    return campaigns.filter((campaign) =>
      `${campaign.name} ${campaign.region}`.toLowerCase().includes(query),
    );
  }, [campaigns, searchQuery]);

  const filteredCampaigns = React.useMemo(() => {
    if (role === "SUPER_ADMIN") {
      return matchingCampaigns;
    }
    return matchingCampaigns.filter((campaign) =>
      assignedCampaignIds.includes(campaign.id),
    );
  }, [assignedCampaignIds, matchingCampaigns, role]);

  return (
    <RoleGate action="manage" subject="campaign">
      <div className="space-y-6">
        <Input
          placeholder="Buscar por nombre o region"
          value={searchQuery}
          onChange={(event) => searchCampaigns(event.target.value)}
        />
        {filteredCampaigns.length === 0 ? (
            <EmptyState
              title="Sin clientes"
              description="No hay clientes asignados para este rol."
            />
        ) : null}
        {filteredCampaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCampaigns.map((campaign, index) => (
              <Card
                key={campaign.id}
                className={`panel fade-rise card-hover p-5 ${index % 3 === 0 ? "stagger-1" : index % 3 === 1 ? "stagger-2" : "stagger-3"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const profile = campaignProfiles[campaign.id] ?? fallbackProfile;
                      return (
                        <img
                          src={profile.image}
                          alt={campaign.name}
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                      );
                    })()}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "outline"}>
                      {campaign.status === "ACTIVE" ? "Activo" : "Pausado"}
                    </Badge>
                    <Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 border border-border/60"
                            aria-label="Acciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const profile =
                                campaignProfiles[campaign.id] ?? fallbackProfile;
                              setEditCampaignId(campaign.id);
                              setEditForm({
                                name: campaign.name,
                                region: campaign.region,
                                party: profile.party ?? "",
                                role: profile.role ?? "",
                                number: profile.number ?? "",
                                goal: profile.goal ?? "",
                                image: profile.image ?? "",
                              });
                            }}
                          >
                            Editar cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateCampaignStatus(
                                campaign.id,
                                campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                              )
                            }
                          >
                            {campaign.status === "ACTIVE" ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteCampaignId(campaign.id)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Dialog>
                  </div>
                </div>
                <Dialog
                  open={editCampaignId === campaign.id}
                  onOpenChange={(open: boolean) =>
                    setEditCampaignId(open ? campaign.id : null)
                  }
                >
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Editar cliente</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                        <img
                          src={editForm.image || fallbackProfile.image}
                          alt={editForm.name || "Preview"}
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                        <p className="text-xs text-muted-foreground">Vista previa</p>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={editForm.name}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Nombre"
                        />
                        <Input
                          value={editForm.region}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({
                              ...prev,
                              region: event.target.value,
                            }))
                          }
                          placeholder="Region"
                        />
                        <Input
                          value={editForm.party}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({
                              ...prev,
                              party: event.target.value,
                            }))
                          }
                          placeholder="Partido"
                        />
                        <Input
                          value={editForm.role}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({
                              ...prev,
                              role: event.target.value,
                            }))
                          }
                          placeholder="Cargo"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={editForm.number}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setEditForm((prev) => ({
                                ...prev,
                                number: event.target.value,
                              }))
                            }
                            placeholder="#"
                          />
                          <Input
                            value={editForm.goal}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setEditForm((prev) => ({
                                ...prev,
                                goal: event.target.value,
                              }))
                            }
                            placeholder="Objetivo votos"
                          />
                        </div>
                        <Input
                          value={editForm.image}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({
                              ...prev,
                              image: event.target.value,
                            }))
                          }
                          placeholder="/Rocio-Porras.jpg"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditCampaignId(null)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => {
                              updateCampaign(campaign.id, {
                                name: editForm.name,
                                region: editForm.region,
                              });
                              updateCampaignProfile(campaign.id, {
                                party: editForm.party,
                                role: editForm.role,
                                number: editForm.number,
                                goal: editForm.goal,
                                image: editForm.image,
                              });
                               if (typeof window !== "undefined") {
                                 window.alert("Cliente actualizado");
                               }
                              setEditCampaignId(null);
                            }}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={deleteCampaignId === campaign.id}
                  onOpenChange={(open: boolean) =>
                    setDeleteCampaignId(open ? campaign.id : null)
                  }
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Eliminar cliente</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Esta accion es irreversible. Se eliminara la referencia del cliente.
                    </p>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button variant="outline">Cancelar</Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          removeCampaign(campaign.id);
                          setDeleteCampaignId(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Objetivo votos</p>
                      <p className="text-sm font-semibold text-foreground">
                        {campaignProfiles[campaign.id]?.goal ?? "-"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Proyectados: 760.000
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: "78%" }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[0.65rem] text-muted-foreground">
                      <span>78%</span>
                      <span>
                        760.000 / {campaignProfiles[campaign.id]?.goal ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">Publicaciones pendientes</p>
                    <p className="text-lg font-semibold text-foreground">3</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Objetivo diario: 6 · Pendientes: 3
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Hoy</p>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Tareas
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2 py-2 text-center">
                        <p className="text-[0.65rem] uppercase tracking-wide text-emerald-700">
                          Completadas
                        </p>
                        <p className="text-lg font-semibold text-emerald-900">4</p>
                      </div>
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-2 py-2 text-center">
                        <p className="text-[0.65rem] uppercase tracking-wide text-amber-700">
                          Pendientes
                        </p>
                        <p className="text-lg font-semibold text-amber-900">2</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">Dashboards</p>
                    {(() => {
                      const dashboards = dashboardsByCampaign[campaign.id] ?? [];
                      const summary = {
                        tierra: { active: 0, paused: 0 },
                        mar: { active: 0, paused: 0 },
                        aire: { active: 0, paused: 0 },
                      };
                      dashboards.forEach((dashboard) => {
                        const key = dashboard.template;
                        if (dashboard.status === "ACTIVE") {
                          summary[key].active += 1;
                        } else {
                          summary[key].paused += 1;
                        }
                      });
                      return (
                        <div className="mt-2 space-y-2 text-xs">
                          {([
                            { key: "tierra", label: "Tierra", color: "bg-emerald-500" },
                            { key: "mar", label: "Mar", color: "bg-sky-500" },
                            { key: "aire", label: "Aire", color: "bg-amber-500" },
                          ] as const).map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                <span className="text-muted-foreground">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[0.65rem]">
                                <span className="text-foreground">
                                  {summary[item.key].active} activos
                                </span>
                                <span className="text-muted-foreground">
                                  {summary[item.key].paused} pausa
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Pendientes</span>
                    <Badge variant="outline">
                      {(dashboardsByCampaign[campaign.id] ?? []).filter(
                        (dashboard) => dashboard.status === "DRAFT",
                      ).length}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/console/campaigns/${campaign.id}`}>Entrar</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </RoleGate>
  );
}
