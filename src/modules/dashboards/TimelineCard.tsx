import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const milestones = [
  { day: "Mar 14", title: "Reporte semanal de encuestas", status: "En revision" },
  { day: "Mar 18", title: "Encuentro con referentes", status: "Confirmado" },
  { day: "Mar 22", title: "Simulacro territorial", status: "Planificado" },
];

export const TimelineCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cronograma clave
          </p>
          <p className="text-lg font-semibold text-foreground">
            Proximas acciones
          </p>
        </div>
        <Badge className="bg-secondary text-secondary-foreground">Marzo</Badge>
      </div>
      <div className="mt-5 space-y-4">
        {milestones.map((item) => (
          <div key={item.title} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.status}</p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
