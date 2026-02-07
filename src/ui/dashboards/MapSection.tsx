import { Badge } from "@/ui/primitives/badge";
import { Card } from "@/ui/primitives/card";
import { PeruMapPanel } from "@/ui/maps/PeruMapPanel";

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
        <PeruMapPanel height={320} />
      </div>
    </Card>
  );
};
