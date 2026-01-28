import { EventMapDashboard } from "@/modules/dashboards/events/EventMapDashboard";

const candidateLabels = ["Rocio Porras", "Giovanna Castagnino", "Guillermo Aliaga"];

export default function EventMapDashboardPage() {
  return (
    <EventMapDashboard
      eventTitle="Salida de campo 28 de enero"
      eventSubtitle="Actualizacion en tiempo real"
      candidateLabels={candidateLabels}
      dataUrl="/api/interviews"
    />
  );
}
