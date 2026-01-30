export const DASHBOARD_THEME = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export type DashboardTheme =
  (typeof DASHBOARD_THEME)[keyof typeof DASHBOARD_THEME];

export const PANORAMA_SECTION = {
  SUMMARY: "summary",
  PAGES: "pages",
  USER_SOURCES: "user_sources",
  SESSION_SOURCES: "session_sources",
  DAY: "day",
  PLATFORM: "platform",
  CITIES: "cities",
  AUDIENCE: "audience",
} as const;

export type PanoramaSection =
  (typeof PANORAMA_SECTION)[keyof typeof PANORAMA_SECTION];

export const SUMMARY_FORMAT = {
  NUMBER: "number",
  SECONDS: "seconds",
} as const;

export type SummaryFormat =
  (typeof SUMMARY_FORMAT)[keyof typeof SUMMARY_FORMAT];

export const PANORAMA_REPORT_PATH =
  "/guillermo/Hoja%20de%20c%C3%A1lculo%20sin%20t%C3%ADtulo%20-%20Hoja%201.csv";
export const PANORAMA_REPORT_PATH_ALT = PANORAMA_REPORT_PATH;

export const LANDINGS_TSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1ZfnXMBrIId0-hghZvQIRZngJyXIDIdr1YWY9jkVrN62bFrqcHCYX6L8Iur9MzeEobft0JxfN04bw/pub?gid=0&single=true&output=csv";

export const FACEBOOK_DATASET_PATH =
  "/guillermo/dataset_facebook-posts-scraper_2026-01-21_18-02-27-654.json";
export const FACEBOOK_DATASET_PATHS = [
  "/guillermo/dataset_facebook-posts-scraper_2026-01-21_18-02-27-654.json",
  "/guillermo/dataset_facebook-posts-scraper_2026-01-30_16-29-29-366.json",
];

export const CAMPAIGNS_RESULTS_CSV_PATH =
  "/guillermo/Campaña-Aliaga-Campañas-30-dic.-2022-30-ene.-2026.csv";

export const GUILLERMO_MAP_DATASETS = [
  "departamentos",
  "registros_actividades",
  "registros_votantes",
  "registros_paneles",
] as const;

export type GuillermoMapDataset = (typeof GUILLERMO_MAP_DATASETS)[number];

export const TOTAL_INTERACTIONS_DISPLAY = 23251;
export const GROWTH_CUTOFF_DATE = "2025-11-24";

export const DATOS_TOTAL = 4071;
export const DATOS = {
  digital: 4071,
  territorial: 0,
} as const;

export const CONTACTADOS = {
  digital: 4071,
  territorial: 0,
} as const;

export const CONTACTOS_FORMULARIOS = [
  {
    id: "form-digital",
    name: "Formulario digital principal",
    leads: 620,
    dateKey: "2026-01-21",
    dateLabel: "21 Ene 2026",
    source: "Landing Oficial",
  },
  {
    id: "form-territorial",
    name: "Formulario territorial",
    leads: 410,
    dateKey: "2026-01-20",
    dateLabel: "20 Ene 2026",
    source: "Eventos de barrio",
  },
  {
    id: "form-voluntarios",
    name: "Formulario voluntarios",
    leads: 290,
    dateKey: "2026-01-19",
    dateLabel: "19 Ene 2026",
    source: "Instagram Bio",
  },
] as const;

export const WHATSAPP_STATS = [
  { id: "conversaciones", label: "Conversaciones iniciadas", value: 150 },
  { id: "nuevos", label: "Contactos etiquetados", value: 92 },
  { id: "pendientes", label: "Pendientes de clasificacion", value: 36 },
] as const;

export const VOLUNTARIOS = [
  { id: "digital", label: "Digital", value: 50 },
  { id: "movimiento", label: "Movimiento", value: 50 },
  { id: "casa", label: "Casa", value: 50 },
] as const;

export const VOLUNTARIOS_TOTAL = 150;
export const WHATSAPP_FOLLOWERS = 1265;
export const FOLLOWERS_BEFORE = 11236;
export const FOLLOWERS_NOW = 34529;

export const TEMAS_CLAVE = [
  {
    label:
      "Apoyo politico y consignas partidarias (Somos Peru / a paso de vencedores)",
    value: 38,
  },
  {
    label: "Presencia territorial y respaldo regional (Loreto / Iquitos)",
    value: 15,
  },
  { label: "Felicitaciones, motivacion y animo al candidato", value: 12 },
] as const;

export const SENTIMENT_DATA = [
  { id: "positivo", label: "Positivo", value: 72, color: "#22c55e" },
  { id: "neutral", label: "Neutral", value: 18, color: "#38bdf8" },
  { id: "negativo", label: "Negativo", value: 8, color: "#f97316" },
  { id: "mixto", label: "Mixto", value: 2, color: "#a855f7" },
] as const;

export type SentimentDatum = (typeof SENTIMENT_DATA)[number];

export const voteGoal = 172638;
export const voteProgress = 510;
