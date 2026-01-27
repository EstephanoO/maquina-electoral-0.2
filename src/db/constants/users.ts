import type { User } from "@/lib/types";

export const users: User[] = [
  {
    id: "user-super",
    name: "Laura Castillo",
    role: "SUPER_ADMIN",
    assignedCampaignIds: ["cand-rocio", "cand-giovanna", "cand-guillermo"],
  },
  {
    id: "user-consultor",
    name: "Martina Ruiz",
    role: "CONSULTOR",
    assignedCampaignIds: ["cand-rocio", "cand-giovanna"],
  },
  {
    id: "user-rocio",
    name: "Rocio Porras",
    role: "CANDIDATO",
    assignedCampaignIds: ["cand-rocio"],
  },
  {
    id: "user-rocio-estratega",
    name: "Rocio Porras (Estratega)",
    role: "ESTRATEGA",
    assignedCampaignIds: ["cand-rocio"],
  },
  {
    id: "user-giovanna",
    name: "Giovanna Castagnino",
    role: "CANDIDATO",
    assignedCampaignIds: ["cand-giovanna"],
  },
  {
    id: "user-guillermo",
    name: "Guillermo Aliaga",
    role: "CANDIDATO",
    assignedCampaignIds: ["cand-guillermo"],
  },
];
