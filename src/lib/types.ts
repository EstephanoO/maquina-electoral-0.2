export type Role =
  | "SUPER_ADMIN"
  | "CONSULTOR"
  | "CANDIDATO"
  | "ESTRATEGA"
  | "DISENADOR"
  | "ENTREVISTADOR";

export type Tenant = {
  id: string;
  name: string;
};

export type Campaign = {
  id: string;
  tenantId: string;
  name: string;
  region: string;
  status: "ACTIVE" | "PAUSED";
};

export type DashboardTemplate = "tierra";
export type DashboardStatus = "ACTIVE" | "DRAFT";

export type AssetFolder = {
  id: string;
  name: string;
  parentId?: string;
  readOnly?: boolean;
};

export type AssetFile = {
  id: string;
  folderId: string;
  name: string;
  type: string;
  version: number;
  updatedAt: string;
  comments: string[];
};

export type User = {
  id: string;
  name: string;
  role: Role;
  assignedCampaignIds: string[];
};
