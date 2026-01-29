import type { SummaryFormat } from "../constants/dashboard";

export type DailyPoint = {
  dateKey: string;
  reach: number;
  interactions: number;
  trend?: number;
};

export type FacebookPost = {
  time?: string;
  comments?: number;
  likes?: number;
  shares?: number;
  viewsCount?: number;
};

export type PanoramaSummary = {
  usuariosActivos: number;
  usuariosNuevos: number;
  tiempoInteraccion: number;
  eventos: number;
};

export type PanoramaPageChart = {
  titulo: string;
  vistas: number;
  usuarios: number;
  eventos: number;
  rebote: number;
  tituloCorto?: string;
};

export type PanoramaSourceChart = {
  fuente: string;
  usuarios: number;
  fuenteCorta?: string;
};

export type PanoramaDaySeries = {
  dayIndex: number;
  dayLabel: string;
  nuevos: number;
  recurrentes: number;
};

export type PanoramaCity = {
  ciudad: string;
  usuarios: number;
};

export type PanoramaData = {
  summary: PanoramaSummary | null;
  pages: PanoramaPageChart[];
  userSources: PanoramaSourceChart[];
  sessionSources: PanoramaSourceChart[];
  daySeries: PanoramaDaySeries[];
  cities: PanoramaCity[];
};

export type SummaryCard = {
  label: string;
  value: number;
  format: SummaryFormat;
};

export type GrowthSeriesItem = {
  id: string;
  label: string;
  value: number;
};

export type SentimentStackDatum = {
  name: string;
  positivo: number;
  neutral: number;
  negativo: number;
  mixto: number;
};
