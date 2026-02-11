"use client";

import * as React from "react";
import { EventMapDashboard } from "@/dashboards/events/containers/EventMapDashboard";
import {
  CESAR_VASQUEZ_CONFIG_STORAGE_KEY,
  CESAR_VASQUEZ_CONFIG_URL,
  DEFAULT_CESAR_VASQUEZ_CONFIG,
  normalizeCesarVasquezConfig,
  type CesarVasquezConfig,
} from "@/ui/reports/info/cesarVasquezConfig";

const extractCandidateNumber = (label: string) => {
  const match = label.match(/#(\d+)/);
  return match?.[1] ?? "3";
};

export const CesarVasquezTierraDashboard = () => {
  const [config, setConfig] = React.useState<CesarVasquezConfig>(
    DEFAULT_CESAR_VASQUEZ_CONFIG,
  );

  React.useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      let nextConfig = DEFAULT_CESAR_VASQUEZ_CONFIG;
      try {
        const response = await fetch(CESAR_VASQUEZ_CONFIG_URL, { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as Partial<CesarVasquezConfig>;
          nextConfig = normalizeCesarVasquezConfig(payload, nextConfig);
        }
      } catch {
        nextConfig = DEFAULT_CESAR_VASQUEZ_CONFIG;
      }

      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Partial<CesarVasquezConfig>;
            nextConfig = normalizeCesarVasquezConfig(parsed, nextConfig);
          } catch {
            window.localStorage.removeItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
          }
        }
      }

      if (!active) return;
      setConfig(nextConfig);
    };

    void loadConfig();
    return () => {
      active = false;
    };
  }, []);

  return (
    <EventMapDashboard
      eventTitle={config.candidateName}
      candidateLabels={[config.candidateName]}
      dataUrl="/api/interviews?client=cesar-vasquez"
      clientKey="cesar-vasquez"
      dataGoal={config.metaDataTotal}
      candidateProfile={{
        name: config.candidateName,
        party: config.partyName,
        role: config.positionLabel,
        number: extractCandidateNumber(config.positionLabel),
        image: config.logoSrc,
      }}
      contextNote={{
        title: config.reportKicker,
        description: config.reportTitle,
        details: [
          `Fecha: ${config.dateLabel}`,
          `Meta datos: ${config.metaDataCurrent} / ${config.metaDataTotal}`,
          `Meta votos: ${config.metaVotesCurrent} / ${config.metaVotesTotal}`,
        ],
      }}
    />
  );
};
