export type InfoFeb8OperatorConfig = {
  type: "feb8";
  operatorSlug?: string;
  title: string;
  subtitle: string;
  badgeDate?: string;
  tableTitle: string;
  tableDescription: string;
  apiBasePath: string;
  supervisor?: string;
  allowRecordsWithoutLinks?: boolean;
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
    operatorSlug: "guillermo",
    title: "Registros Guillermo",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Guillermo",
    allowRecordsWithoutLinks: true,
  },
  giovanna: {
    type: "feb8",
    operatorSlug: "giovanna",
    title: "Registros Giovanna",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Giovanna Castagnino",
    allowRecordsWithoutLinks: true,
  },
  rocio: {
    type: "feb8",
    operatorSlug: "rocio",
    title: "Registros Rocio",
    subtitle: "Jornada de campo del 08 de febrero de 2026",
    badgeDate: "08 Feb 2026",
    tableTitle: "Tabla consolidada",
    tableDescription: "Registros cargados desde el CSV compartido.",
    apiBasePath: "/api/info/8-febrero",
    supervisor: "Rocio Porras",
    allowRecordsWithoutLinks: true,
  },
} as const satisfies Record<string, InfoOperatorConfig>;
