export type CesarVasquezConfig = {
  brandName: string;
  logoSrc: string;
  logoAlt: string;
  reportKicker: string;
  reportTitle: string;
  candidateName: string;
  partyName: string;
  positionLabel: string;
  dateLabel: string;
  metaDataCurrent: string;
  metaDataTotal: string;
  metaVotesCurrent: string;
  metaVotesTotal: string;
  messageTemplate: string;
};

export const CESAR_VASQUEZ_CONFIG_URL = "/info/cesar-vasquez.json";

export const CESAR_VASQUEZ_CONFIG_STORAGE_KEY = "info:cesar-vasquez-config";

export const DEFAULT_CESAR_VASQUEZ_CONFIG: CesarVasquezConfig = {
  brandName: "Goberna",
  logoSrc: "/Logoapp.png",
  logoAlt: "Goberna",
  reportKicker: "Reporte diario",
  reportTitle: "Registros Cesar Vasquez",
  candidateName: "Cesar Vasquez",
  partyName: "Partido APP",
  positionLabel: "SENADOR NACIONAL #3",
  dateLabel: "11 Feb 2026",
  metaDataCurrent: "18",
  metaDataTotal: "800,000",
  metaVotesCurrent: "0",
  metaVotesTotal: "200,000",
  messageTemplate:
    "Hola {nombre}, somos el equipo de Cesar Vasquez (APP). Gracias por tu tiempo. Queremos compartirte una breve actualizacion del trabajo territorial.",
};

const coerceString = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const normalizeCesarVasquezConfig = (
  value: Partial<CesarVasquezConfig> | null | undefined,
  fallback: CesarVasquezConfig = DEFAULT_CESAR_VASQUEZ_CONFIG,
): CesarVasquezConfig => {
  return {
    brandName: coerceString(value?.brandName, fallback.brandName),
    logoSrc: coerceString(value?.logoSrc, fallback.logoSrc),
    logoAlt: coerceString(value?.logoAlt, fallback.logoAlt),
    reportKicker: coerceString(value?.reportKicker, fallback.reportKicker),
    reportTitle: coerceString(value?.reportTitle, fallback.reportTitle),
    candidateName: coerceString(value?.candidateName, fallback.candidateName),
    partyName: coerceString(value?.partyName, fallback.partyName),
    positionLabel: coerceString(value?.positionLabel, fallback.positionLabel),
    dateLabel: coerceString(value?.dateLabel, fallback.dateLabel),
    metaDataCurrent: coerceString(value?.metaDataCurrent, fallback.metaDataCurrent),
    metaDataTotal: coerceString(value?.metaDataTotal, fallback.metaDataTotal),
    metaVotesCurrent: coerceString(value?.metaVotesCurrent, fallback.metaVotesCurrent),
    metaVotesTotal: coerceString(value?.metaVotesTotal, fallback.metaVotesTotal),
    messageTemplate: coerceString(value?.messageTemplate, fallback.messageTemplate),
  };
};
