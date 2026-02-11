"use client";

import { EventMapDashboard } from "@/dashboards/events/containers/EventMapDashboard";

export const CesarVasquezTierraDashboard = () => {
  return (
    <EventMapDashboard
      eventTitle="Cesar Vasquez"
      candidateLabels={["Cesar Vasquez"]}
      dataUrl="/api/interviews?client=cesar-vasquez"
      clientKey="cesar-vasquez"
      dataGoal="15000"
      candidateProfile={{
        name: "Cesar Vasquez",
        party: "APP",
        role: "Senador Nacional",
        number: "3",
        image: "/Logoapp.png",
      }}
      contextNote={{
        title: "Operacion Lima",
        description: "Dashboard simulado con puntos de Lima para Cesar Vasquez.",
        details: ["Datos mockeados", "Tracking simulado", "Meta operativa: 15,000"],
      }}
    />
  );
};
