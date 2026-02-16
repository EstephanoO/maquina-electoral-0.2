import { campaigns } from "@/db/constants";

const explicitClientToCampaignId: Record<string, string> = {
  rocio: "cand-rocio",
  giovanna: "cand-giovanna",
  guillermo: "cand-guillermo",
  "cesar-vasquez": "cand-cesar-vasquez",
};

export const resolveCampaignIdFromClient = (client: string | null) => {
  if (!client) return null;
  const normalized = client.toLowerCase();
  if (explicitClientToCampaignId[normalized]) return explicitClientToCampaignId[normalized];
  const match = campaigns.find((campaign) => campaign.name.toLowerCase() === normalized);
  return match?.id ?? null;
};
