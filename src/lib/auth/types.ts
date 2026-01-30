export type AuthRole = "admin" | "candidato";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  campaignId: string | null;
  assignedCampaignIds: string[];
};
