import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const highlights = [
  "Crecimiento sostenido en zona centro.",
  "Narrativa digital en fase de ajuste.",
  "Cobertura territorial con foco norte.",
];

export const CampaignOverview = () => {
  return (
    <Card className="panel fade-rise card-hover p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <h3 className="heading-display text-xl font-semibold text-foreground">
            Panorama ejecutivo
          </h3>
        </div>
        <Badge variant="outline">Actualizado hoy</Badge>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {highlights.map((item) => (
          <li key={item} className="rounded-xl border border-border/60 bg-background/70 p-3">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
};
