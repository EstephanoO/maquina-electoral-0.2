import type { Role } from "@/lib/types";

export type Action =
  | "view"
  | "manage"
  | "create"
  | "update"
  | "capture"
  | "admin";

export type Subject =
  | "campaign"
  | "event"
  | "form"
  | "response"
  | "asset"
  | "admin"
  | "tenant";

type Rule = {
  role: Role;
  actions: Action[];
  subjects: Subject[];
};

const rules: Rule[] = [
  {
    role: "SUPER_ADMIN",
    actions: ["view", "manage", "admin"],
    subjects: ["tenant", "campaign", "event", "form", "response", "asset", "admin"],
  },
  {
    role: "CONSULTOR",
    actions: ["view", "manage", "create", "update"],
    subjects: ["campaign", "event", "form", "response", "asset"],
  },
  {
    role: "CANDIDATO",
    actions: ["view"],
    subjects: ["campaign", "event", "response"],
  },
  {
    role: "ESTRATEGA",
    actions: ["view"],
    subjects: ["campaign", "event", "response"],
  },
  {
    role: "DISENADOR",
    actions: ["view", "manage", "update"],
    subjects: ["asset"],
  },
  {
    role: "ENTREVISTADOR",
    actions: ["view", "capture", "create"],
    subjects: ["event", "form", "response"],
  },
];

export const can = (action: Action, subject: Subject, role: Role) => {
  return rules.some(
    (rule) =>
      rule.role === role &&
      rule.actions.includes(action) &&
      rule.subjects.includes(subject),
  );
};
