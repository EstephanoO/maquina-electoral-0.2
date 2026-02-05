import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Campaign, DashboardStatus, DashboardTemplate } from "@/lib/types";
import { campaigns as seedCampaigns } from "@/db/constants";
import { useSessionStore } from "@/stores/session.store";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const asRecord = <T extends Record<string, unknown>>(value: unknown, fallback: T): T =>
  (isRecord(value) ? (value as T) : fallback);
const asArray = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

type CampaignState = {
  campaigns: Campaign[];
  searchQuery: string;
  dashboardsByCampaign: Record<
    string,
    Array<{
      template: DashboardTemplate;
      status: DashboardStatus;
      eventId?: string;
      name?: string;
      date?: string;
      team?: string;
    }>
  >;
  campaignProfiles: Record<
    string,
    {
      image: string;
      goal: string;
      party: string;
      role: string;
      number: string;
    }
  >;
};

type CampaignActions = {
  selectCampaign: (campaignId: string) => void;
  searchCampaigns: (query: string) => void;
  createDashboard: (
    campaignId: string,
    payload: {
      template: DashboardTemplate;
      status: DashboardStatus;
      eventId?: string;
      name?: string;
      date?: string;
      team?: string;
    },
  ) => void;
  disableDashboard: (campaignId: string, template: DashboardTemplate) => void;
  updateDashboardStatus: (
    campaignId: string,
    template: DashboardTemplate,
    status: DashboardStatus,
  ) => void;
  updateCampaignStatus: (campaignId: string, status: "ACTIVE" | "PAUSED") => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  updateCampaignProfile: (
    campaignId: string,
    updates: Partial<CampaignState["campaignProfiles"][string]>,
  ) => void;
  removeCampaign: (campaignId: string) => void;
};

const defaultDashboardsByCampaign: CampaignState["dashboardsByCampaign"] = {
  "cand-rocio": [
    {
      template: "tierra",
      status: "ACTIVE",
      eventId: "event-rocio-01",
      name: "Salida a campo 28 de enero",
      date: "2026-01-28",
      team: "Equipo de terreno",
    },
    {
      template: "mar",
      status: "ACTIVE",
    },
    {
      template: "aire",
      status: "ACTIVE",
    },
  ],
  "cand-giovanna": [
    {
      template: "tierra",
      status: "ACTIVE",
      eventId: "event-giovanna-01",
      name: "Salida a campo 28 de enero",
      date: "2026-01-28",
      team: "Equipo de terreno",
    },
    {
      template: "mar",
      status: "ACTIVE",
    },
    {
      template: "aire",
      status: "ACTIVE",
    },
  ],
  "cand-guillermo": [
    {
      template: "tierra",
      status: "ACTIVE",
      eventId: "event-guillermo-01",
      name: "Salida a campo 28 de enero",
      date: "2026-01-28",
      team: "Equipo de terreno",
    },
    {
      template: "mar",
      status: "ACTIVE",
    },
    {
      template: "aire",
      status: "ACTIVE",
    },
  ],
};

const defaultCampaignProfiles: CampaignState["campaignProfiles"] = {
  "cand-rocio": {
    image: "/Rocio-Porras.jpg",
    goal: "80.000",
    party: "Somos Peru",
    role: "Senadora Nacional",
    number: "#4",
  },
  "cand-giovanna": {
    image: "/giovanna-castagnino.jpg",
    goal: "860.000",
    party: "Somos Peru",
    role: "Senadora Nacional",
    number: "#12",
  },
  "cand-guillermo": {
    image: "/2guillermo.jpg",
    goal: "1.200.000",
    party: "Somos Peru",
    role: "Senador Nacional",
    number: "#1",
  },
};

export const useCampaignsStore = create<CampaignState & CampaignActions>()(
  persist(
    (set) => ({
      campaigns: seedCampaigns,
      searchQuery: "",
      dashboardsByCampaign: defaultDashboardsByCampaign,
      campaignProfiles: defaultCampaignProfiles,
      selectCampaign: (campaignId) => {
        useSessionStore.getState().setActiveCampaign(campaignId);
      },
      searchCampaigns: (query) => set({ searchQuery: query }),
      createDashboard: (campaignId, payload) =>
        set((state) => {
          const current = state.dashboardsByCampaign[campaignId] ?? [];
          const existingIndex = current.findIndex(
            (dashboard) => dashboard.template === payload.template,
          );
          const next = [...current];
          if (existingIndex >= 0) {
            next[existingIndex] = { ...next[existingIndex], ...payload };
          } else {
            next.push(payload);
          }
          return {
            dashboardsByCampaign: {
              ...state.dashboardsByCampaign,
              [campaignId]: next,
            },
          };
        }),
      disableDashboard: (campaignId, template) =>
        set((state) => {
          const current = state.dashboardsByCampaign[campaignId] ?? [];
          return {
            dashboardsByCampaign: {
              ...state.dashboardsByCampaign,
              [campaignId]: current.filter((item) => item.template !== template),
            },
          };
        }),
      updateDashboardStatus: (campaignId, template, status) =>
        set((state) => {
          const current = state.dashboardsByCampaign[campaignId] ?? [];
          return {
            dashboardsByCampaign: {
              ...state.dashboardsByCampaign,
              [campaignId]: current.map((dashboard) =>
                dashboard.template === template ? { ...dashboard, status } : dashboard,
              ),
            },
          };
        }),
      updateCampaignStatus: (campaignId, status) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) =>
            campaign.id === campaignId ? { ...campaign, status } : campaign,
          ),
        })),
      updateCampaign: (campaignId, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) =>
            campaign.id === campaignId ? { ...campaign, ...updates } : campaign,
          ),
        })),
      updateCampaignProfile: (campaignId, updates) =>
        set((state) => ({
          campaignProfiles: {
            ...state.campaignProfiles,
            [campaignId]: {
              ...state.campaignProfiles[campaignId],
              ...updates,
            },
          },
        })),
      removeCampaign: (campaignId) =>
        set((state) => ({
          campaigns: state.campaigns.filter((campaign) => campaign.id !== campaignId),
          dashboardsByCampaign: Object.fromEntries(
            Object.entries(state.dashboardsByCampaign).filter(
              ([key]) => key !== campaignId,
            ),
          ),
          campaignProfiles: Object.fromEntries(
            Object.entries(state.campaignProfiles).filter(
              ([key]) => key !== campaignId,
            ),
          ),
        })),
    }),
    {
      name: "maquina-campaigns",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = isRecord(persistedState) ? (persistedState as Partial<CampaignState>) : {};
        return {
          campaigns: asArray<Campaign>(state.campaigns, seedCampaigns),
          searchQuery: typeof state.searchQuery === "string" ? state.searchQuery : "",
          dashboardsByCampaign: asRecord(state.dashboardsByCampaign, defaultDashboardsByCampaign),
          campaignProfiles: asRecord(state.campaignProfiles, defaultCampaignProfiles),
        } as CampaignState;
      },
      partialize: (state) => ({
        dashboardsByCampaign: state.dashboardsByCampaign,
        campaigns: state.campaigns,
        campaignProfiles: state.campaignProfiles,
      }),
    },
  ),
);
