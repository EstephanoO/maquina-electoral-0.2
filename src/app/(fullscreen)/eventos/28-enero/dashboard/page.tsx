import { MapPanel } from "@/modules/maps/MapPanel";

export default function EventMapDashboardPage() {
  return (
    <div className="h-screen w-screen">
      <MapPanel height={null} className="h-full w-full rounded-none border-0 shadow-none" />
    </div>
  );
}
