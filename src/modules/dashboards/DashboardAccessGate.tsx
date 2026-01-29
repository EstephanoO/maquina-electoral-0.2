"use client";

import { useEffect, type ReactNode } from "react";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { useSessionStore } from "@/stores/session.store";
import { EmptyState } from "@/modules/shared/EmptyState";

const slugToCampaignId: Record<string, string> = {
  rocio: "cand-rocio",
  giovanna: "cand-giovanna",
  guillermo: "cand-guillermo",
};

export const DashboardAccessGate = ({
  children,
  template,
  client,
  campaignId,
  allowDraft = false,
  skipEventSchedule = false,
}: {
  children: ReactNode;
  template: "tierra" | "mar" | "aire";
  client?: string;
  campaignId?: string;
  allowDraft?: boolean;
  skipEventSchedule?: boolean;
}) => {
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const setActiveCampaign = useSessionStore((state) => state.setActiveCampaign);
  const dashboardsByCampaign = useCampaignsStore((state) => state.dashboardsByCampaign);
  const resolvedCampaignId =
    campaignId ?? (client ? slugToCampaignId[client] : undefined) ?? activeCampaignId;

  useEffect(() => {
    if (resolvedCampaignId && resolvedCampaignId !== activeCampaignId) {
      setActiveCampaign(resolvedCampaignId);
    }
  }, [resolvedCampaignId, activeCampaignId, setActiveCampaign]);

  if (client && !slugToCampaignId[client]) {
    return (
      <EmptyState
        title="Cliente invalido"
        description="El dashboard solicitado no corresponde a un cliente registrado."
      />
    );
  }

  if (!resolvedCampaignId) {
    return (
      <EmptyState
        title="Dashboard no disponible"
        description="No hay un cliente activo para este dashboard."
      />
    );
  }

  const dashboards = dashboardsByCampaign[resolvedCampaignId] ?? [];
  const dashboard = dashboards.find((item) => item.template === template);
  if (!dashboard) {
    return (
      <EmptyState
        title="Dashboard no disponible"
        description="Crea un dashboard desde Gestion para habilitarlo."
      />
    );
  }

  if (dashboard.status !== "ACTIVE" && !allowDraft) {
    return (
      <EmptyState
        title="Dashboard pendiente"
        description="Completa el formulario y activa el dashboard para verlo."
      />
    );
  }

  if (template === "tierra" && dashboard.date && !skipEventSchedule) {
    const eventStart = new Date(`${dashboard.date}T05:00:00-05:00`);
    if (Number.isFinite(eventStart.getTime()) && Date.now() < eventStart.getTime()) {
      return (
        <EmptyState
          title="Evento aun no inicia"
          description="El acceso se habilita el 28 de enero a las 05:00 (hora local)."
        />
      );
    }
  }

  return <>{children}</>;
};
