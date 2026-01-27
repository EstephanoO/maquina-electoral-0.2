import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPanel } from "@/modules/maps/MapPanel";

export const MapSection = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mapa territorial
          </p>
          <p className="text-lg font-semibold text-foreground">
            Cobertura por zona
          </p>
        </div>
        <Badge variant="outline">Opcional</Badge>
      </div>
      <div className="mt-4">
        <MapPanel height={320} />
      </div>
    </Card>
  );
};
