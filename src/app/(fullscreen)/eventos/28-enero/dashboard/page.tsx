import { MapLivePanel } from "@/modules/maps/MapLivePanel";

export default function EventMapDashboardPage() {
  return (
    <div className="h-screen w-screen">
      <MapLivePanel className="h-full w-full rounded-none border-0 shadow-none" />
    </div>
  );
}
