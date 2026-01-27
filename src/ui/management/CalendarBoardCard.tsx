import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/ui/management/SectionHeader";

const weekItems = [
  { day: "Lun", task: "Reunion con equipo digital" },
  { day: "Mie", task: "Visita a territorio 7" },
  { day: "Vie", task: "Reporte de encuestas" },
];

const monthItems = [
  { day: "Mar 5", task: "Lanzamiento voluntariado" },
  { day: "Mar 12", task: "Town hall" },
  { day: "Mar 21", task: "Encuentro con medios" },
];

export const CalendarBoardCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Cronograma"
        title="Board calendario"
        tag="Organizacion"
        actions={<Button variant="outline">Nueva reunion</Button>}
      />
      <Tabs defaultValue="week" className="mt-5">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="mt-4 space-y-3">
          {weekItems.map((item) => (
            <div key={item.task} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.task}</p>
                <p className="text-xs text-muted-foreground">Asignado a consultor</p>
              </div>
              <Badge className="bg-secondary text-secondary-foreground">{item.day}</Badge>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="month" className="mt-4 space-y-3">
          {monthItems.map((item) => (
            <div key={item.task} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.task}</p>
                <p className="text-xs text-muted-foreground">Planificacion general</p>
              </div>
              <Badge variant="outline">{item.day}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
