export type InfoFeb8OperatorConfig = {
  type: "feb8";
  title: string;
  subtitle: string;
  badgeDate?: string;
  tableTitle: string;
  tableDescription: string;
  apiBasePath: string;
  supervisor?: string;
};

export type InfoHabilitacionesOperatorConfig = {
  type: "habilitaciones";
  operatorSlug: string;
};

export type InfoOperatorConfig =
  | InfoFeb8OperatorConfig
  | InfoHabilitacionesOperatorConfig;

export const infoOperatorConfigs = {
  guillermo: {
    type: "feb8",
    title: "Registros Guillermo",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Guillermo",
  },
  giovanna: {
    type: "feb8",
    title: "Registros Giovanna",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Giovanna Castagnino",
  },
  rocio: {
    type: "feb8",
    title: "Registros Rocio",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Rocio Porras",
  },
} as const satisfies Record<string, InfoOperatorConfig>;
