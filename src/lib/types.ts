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

export type DashboardTemplate = "tierra" | "mar" | "aire";
export type DashboardStatus = "ACTIVE" | "DRAFT";

export type EventStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export type CampaignEvent = {
  id: string;
  campaignId: string;
  name: string;
  status: EventStatus;
  startDate: string;
  endDate?: string;
  dashboardTemplate?: DashboardTemplate;
  contactName?: string;
  contactPhone?: string;
  location?: string;
  clients?: string[];
};

export type FormFieldType =
  | "text"
  | "number"
  | "radio"
  | "checkbox"
  | "select"
  | "textarea"
  | "location";

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
};

export type FormSchema = {
  eventId: string;
  fields: FormField[];
  updatedAt: string;
};

export type ResponseLocation = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type ResponseRecord = {
  id: string;
  eventId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
  location?: ResponseLocation;
};

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
