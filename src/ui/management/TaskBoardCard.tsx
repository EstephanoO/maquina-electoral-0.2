import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/ui/management/SectionHeader";

const tasks = [
  {
    title: "Actualizar narrativa digital",
    owner: "Equipo creativo",
    files: ["template-banner.psd", "brief-copy.docx"],
  },
  {
    title: "Mapa de cobertura semanal",
    owner: "Analitica",
    files: ["base-territorio.geojson", "capas-qml.qml"],
  },
  {
    title: "Agenda de reuniones",
    owner: "Consultor Norte",
    files: ["agenda-semanal.xlsx"],
  },
];

export const TaskBoardCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Tareas"
        title="Board operativo"
        tag="Disenadores + Consultores"
        actions={<Button variant="outline">Nueva tarea</Button>}
      />
      <div className="mt-5 space-y-4">
        {tasks.map((task) => (
          <div key={task.title} className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">Responsable: {task.owner}</p>
              </div>
              <Select defaultValue="consultor">
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Asignar consultor</SelectItem>
                  <SelectItem value="disenador">Asignar disenador</SelectItem>
                  <SelectItem value="equipo">Equipo central</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.files.map((file) => (
                <Badge key={file} variant="outline">
                  {file}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
