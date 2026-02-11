export type Operator = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type FormMapPoint = {
  id: string;
  clientId: string | null;
  name: string;
  phone: string;
  candidate: string | null;
  interviewer: string | null;
  createdAt: string | null;
  latitude: number;
  longitude: number;
};

export type FormAccessRecord = {
  formId: string;
  enabledAt: string;
  enabledBy: string | null;
  name: string;
  phone: string;
  candidate: string | null;
  interviewer: string | null;
  createdAt: string | null;
  clientId: string | null;
};

export type FormAccessStatus = {
  formId: string;
  operatorId: string;
  contacted: boolean;
  replied: boolean;
  deleted: boolean;
  homeMapsUrl: string | null;
  pollingPlaceUrl: string | null;
  linksComment: string | null;
  updatedAt: string | null;
};
