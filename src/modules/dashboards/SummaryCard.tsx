import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const highlights = [
  "Clima positivo en zona centro con crecimiento sostenido.",
  "La narrativa digital necesita refuerzo en seguridad.",
  "Fortalecer presencia barrial en los distritos 3 y 7.",
];

export const SummaryCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen estrategico
          </p>
          <p className="text-lg font-semibold text-foreground">
            Lectura de campana
          </p>
        </div>
        <Badge className="bg-secondary text-secondary-foreground">Semana 11</Badge>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-foreground/70">
        {highlights.map((item) => (
          <li key={item} className="rounded-xl border border-border/60 bg-background/70 p-3">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
};
