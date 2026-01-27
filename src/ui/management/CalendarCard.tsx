import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/ui/management/SectionHeader";

const tasks = [
  { date: "Mar 20", task: "Capacitacion de fiscales" },
  { date: "Mar 23", task: "Gira territorial sur" },
  { date: "Mar 26", task: "Revision de encuestas" },
];

export const CalendarCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Cronograma"
        title="Calendario tactico"
        tag="Semana 12"
        actions={<Button variant="outline">Nueva tarea</Button>}
      />
      <div className="mt-5 space-y-3">
        {tasks.map((item) => (
          <div
            key={item.task}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{item.task}</p>
              <p className="text-xs text-muted-foreground">Equipo operativo</p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">
              {item.date}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
