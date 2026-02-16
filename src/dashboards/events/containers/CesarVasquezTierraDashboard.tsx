"use client";

import * as React from "react";
import { EventMapDashboard } from "@/dashboards/events/containers/EventMapDashboard";

const CESAR_VASQUEZ_CANDIDATE = {
  candidateName: "Cesar Vasquez",
  partyName: "Partido APP",
  positionLabel: "SENADOR NACIONAL #3",
  dateLabel: "11 Feb 2026",
  logoSrc: "/Logoapp.png",
  metaDataTotal: "300,000",
  metaVotesTotal: "100,000",
};

const extractCandidateNumber = (label: string) => {
  const match = label.match(/#(\d+)/);
  return match?.[1] ?? "3";
};

export const CesarVasquezTierraDashboard = () => {
  return (
    <EventMapDashboard
      eventTitle={CESAR_VASQUEZ_CANDIDATE.candidateName}
      candidateLabels={[CESAR_VASQUEZ_CANDIDATE.candidateName]}
      dataUrl="/api/interviews?client=cesar-vasquez"
      clientKey="cesar-vasquez"
      campaignId="cesar-vasquez"
      dataGoal={300000}
      votesGoal={100000}
      candidateProfile={{
        name: CESAR_VASQUEZ_CANDIDATE.candidateName,
        party: CESAR_VASQUEZ_CANDIDATE.partyName,
        role: CESAR_VASQUEZ_CANDIDATE.positionLabel,
        number: extractCandidateNumber(CESAR_VASQUEZ_CANDIDATE.positionLabel),
        image: CESAR_VASQUEZ_CANDIDATE.logoSrc,
      }}
      contextNote={{
        title: "Reporte diario",
        description: "Registros Cesar Vasquez",
        details: [
          `Fecha: ${CESAR_VASQUEZ_CANDIDATE.dateLabel}`,
          `Meta de votos: 0 / ${CESAR_VASQUEZ_CANDIDATE.metaVotesTotal}`,
        ],
      }}
      hideMapLegend={true}
    />
  );
};
