import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/ui/management/SectionHeader";

const dashboards = [
  { name: "War room central", status: "Activo" },
  { name: "Territorio y mapas", status: "Revision" },
  { name: "Narrativa digital", status: "En curso" },
];

export const DashboardAdminCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Dashboards"
        title="Gestion de vistas"
        tag="Multi panel"
        actions={<Button>Nueva vista</Button>}
      />
      <div className="mt-5 space-y-3">
        {dashboards.map((item) => (
          <div
            key={item.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Ultima edicion hace 2 horas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{item.status}</Badge>
              <Button variant="outline" size="sm">
                Administrar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
