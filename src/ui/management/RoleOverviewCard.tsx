import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/roles/permissions";
import { RoleBadge } from "@/ui/roles/RoleBadge";

const summaries: Record<UserRole, { title: string; copy: string }[]> = {
  admin: [
    { title: "Dashboards", copy: "Control total de vistas y paneles." },
    { title: "Consultores", copy: "Asignacion y permisos avanzados." },
    { title: "Clientes", copy: "Mapeo de cartera y prioridades." },
  ],
  consultor: [
    { title: "Dashboards", copy: "Edicion y seguimiento operativo." },
    { title: "Clientes", copy: "Gestion de equipos activos." },
    { title: "Datos", copy: "Carga de insumos y capas." },
  ],
  disenador: [
    { title: "Assets", copy: "Templates, editables y piezas clave." },
    { title: "Tareas", copy: "Colaboracion con consultores." },
    { title: "Archivos", copy: "Drive y referencias visuales." },
  ],
  cliente: [
    { title: "Informes", copy: "Lectura de resultados en tiempo real." },
    { title: "Narrativa", copy: "KPIs y percepcion digital." },
    { title: "Territorio", copy: "Mapas y cronogramas." },
  ],
};

export const RoleOverviewCard = ({ role }: { role: UserRole }) => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Consola
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            Gestion integral
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={role} />
          <Badge className="bg-secondary text-secondary-foreground">UI Only</Badge>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {summaries[role].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.copy}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
