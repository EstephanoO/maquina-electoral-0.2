import type { CampaignEvent } from "@/lib/types";

export const events: CampaignEvent[] = [
  {
    id: "event-rocio-01",
    campaignId: "cand-rocio",
    name: "Salida a campo 28 de enero",
    status: "ACTIVE",
    startDate: "2026-01-28",
    dashboardTemplate: "tierra",
    clients: ["Rocio Porras"],
    contactName: "Andrea Pacheco",
    contactPhone: "+51 987 221 445",
    location: "Lima Centro · Plaza San Martin",
  },
  {
    id: "event-giovanna-01",
    campaignId: "cand-giovanna",
    name: "Salida a campo 28 de enero",
    status: "ACTIVE",
    startDate: "2026-01-28",
    dashboardTemplate: "tierra",
    clients: ["Giovanna Castagnino"],
  },
  {
    id: "event-guillermo-01",
    campaignId: "cand-guillermo",
    name: "Salida a campo 28 de enero",
    status: "ACTIVE",
    startDate: "2026-01-28",
    dashboardTemplate: "tierra",
    clients: ["Guillermo Aliaga"],
  },
];
