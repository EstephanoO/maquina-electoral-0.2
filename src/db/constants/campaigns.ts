import type { Campaign } from "@/lib/types";

export const campaigns: Campaign[] = [
  {
    id: "cand-rocio",
    tenantId: "tenant-goberna",
    name: "Rocio Porras",
    region: "Senadora Nacional #4",
    status: "ACTIVE",
  },
  {
    id: "cand-giovanna",
    tenantId: "tenant-goberna",
    name: "Giovanna Castagnino",
    region: "Senadora Nacional #12",
    status: "ACTIVE",
  },
  {
    id: "cand-guillermo",
    tenantId: "tenant-goberna",
    name: "Guillermo Aliaga",
    region: "Senador Nacional #1",
    status: "PAUSED",
  },
];
