import { EventMapDashboard } from "@/modules/dashboards/events/EventMapDashboard";

const candidateLabels = ["Rocio Porras"];

const candidateProfile = {
  name: "Rocio Porras",
  party: "Somos Peru",
  role: "Senadora Nacional",
  number: "#4",
  image: "/Rocio-Porras.jpg",
};

export default function EventMapDashboardRocioPage() {
  return (
    <EventMapDashboard
      eventTitle=""
      eventSubtitle=""
      candidateLabels={candidateLabels}
      candidateProfile={candidateProfile}
      dataGoal="85,440"
      layoutVariant="compact"
      dataUrl="/api/interviews"
    />
  );
}
