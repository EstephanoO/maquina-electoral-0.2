import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role } from "@/lib/types";
import { users, tenants, campaigns } from "@/db/constants";

type SessionState = {
  currentUserId: string;
  currentRole: Role;
  activeTenantId: string;
  activeCampaignId: string;
  _hasHydrated: boolean;
};

type SessionActions = {
  setUser: (userId: string) => void;
  setRole: (role: Role) => void;
  setActiveCampaign: (campaignId: string) => void;
  setActiveTenant: (tenantId: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

const defaultUser = users[0];
const defaultCampaign = campaigns[0];
const defaultTenant = tenants[0];

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      currentUserId: defaultUser.id,
      currentRole: defaultUser.role,
      activeTenantId: defaultTenant.id,
      activeCampaignId: defaultCampaign.id,
      _hasHydrated: false,
      setUser: (userId) =>
        set(() => {
          const user = users.find((item) => item.id === userId) ?? users[0];
          const nextCampaign =
            campaigns.find((campaign) =>
              user.assignedCampaignIds.includes(campaign.id),
            ) ?? campaigns[0];
          return {
            currentUserId: user.id,
            currentRole: user.role,
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
