import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventTierraOverview } from "@/modules/dashboards/EventTierraOverview";

export default function EventOverviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/console">Volver</Link>
        </Button>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            EVENTO
          </p>
          <p className="text-sm font-semibold text-foreground">Salida de campo 28 de enero</p>
        </div>
      </header>
      <div className="flex-1 px-4 py-4">
        <EventTierraOverview />
      </div>
    </div>
  );
}
