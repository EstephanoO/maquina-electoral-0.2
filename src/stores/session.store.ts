import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role } from "@/lib/types";
import { campaigns, tenants } from "@/db/constants";
import type { SessionUser } from "@/lib/auth/types";

type SessionState = {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  currentRole: Role;
  assignedCampaignIds: string[];
  activeTenantId: string;
  activeCampaignId: string;
  _hasHydrated: boolean;
};

type SessionActions = {
  setSessionUser: (user: SessionUser | null) => void;
  setRole: (role: Role) => void;
  setActiveCampaign: (campaignId: string) => void;
  setActiveTenant: (tenantId: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

const defaultCampaign = campaigns[0];
const defaultTenant = tenants[0];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      currentUserId: "",
      currentUserName: "",
      currentUserEmail: "",
      currentRole: "CANDIDATO",
      assignedCampaignIds: [],
      activeTenantId: defaultTenant.id,
      activeCampaignId: defaultCampaign.id,
      _hasHydrated: false,
      setSessionUser: (user) =>
        set(() => {
          if (!user) {
            return {
              currentUserId: "",
              currentUserName: "",
              currentUserEmail: "",
              currentRole: "CANDIDATO",
              assignedCampaignIds: [],
              activeCampaignId: defaultCampaign.id,
            };
          }
          const nextCampaign =
            campaigns.find((campaign) => user.assignedCampaignIds.includes(campaign.id)) ??
            campaigns[0];
          return {
            currentUserId: user.id,
            currentUserName: user.name,
            currentUserEmail: user.email,
            currentRole: user.role === "admin" ? "SUPER_ADMIN" : "CANDIDATO",
            assignedCampaignIds: user.assignedCampaignIds,
            activeCampaignId: nextCampaign.id,
          };
        }),
      setRole: (role) => set({ currentRole: role }),
      setActiveCampaign: (campaignId) => set({ activeCampaignId: campaignId }),
      setActiveTenant: (tenantId) => set({ activeTenantId: tenantId }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: "maquina-session",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = isRecord(persistedState) ? (persistedState as Partial<SessionState>) : {};
        return {
          currentUserId: isString(state.currentUserId) ? state.currentUserId : "",
          currentUserName: isString(state.currentUserName) ? state.currentUserName : "",
          currentUserEmail: isString(state.currentUserEmail) ? state.currentUserEmail : "",
          currentRole: (state.currentRole ?? "CANDIDATO") as Role,
          assignedCampaignIds: Array.isArray(state.assignedCampaignIds)
            ? (state.assignedCampaignIds as string[])
            : [],
          activeTenantId: isString(state.activeTenantId) ? state.activeTenantId : defaultTenant.id,
          activeCampaignId: isString(state.activeCampaignId)
            ? state.activeCampaignId
            : defaultCampaign.id,
          _hasHydrated: false,
        } as SessionState;
      },
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        currentUserName: state.currentUserName,
        currentUserEmail: state.currentUserEmail,
        currentRole: state.currentRole,
        assignedCampaignIds: state.assignedCampaignIds,
        activeTenantId: state.activeTenantId,
        activeCampaignId: state.activeCampaignId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
