export type InfoFeb8OperatorConfig = {
  type: "feb8";
  title: string;
  subtitle: string;
  badgeDate?: string;
  tableTitle: string;
  tableDescription: string;
  apiBasePath: string;
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
    apiBasePath: "/api/info/8-febrero/guillermo",
  },
  giovanna: {
    type: "feb8",
    title: "Registros Giovanna",
    subtitle: "Contactos habilitados para WhatsApp",
    tableTitle: "Contactos habilitados",
    tableDescription: "Toca un numero para abrir WhatsApp con el mensaje activo.",
    apiBasePath: "/api/info/8-febrero/giovanna",
  },
  rocio: {
    type: "habilitaciones",
    operatorSlug: "rocio",
  },
} as const satisfies Record<string, InfoOperatorConfig>;
