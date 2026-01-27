import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/ui/management/SectionHeader";

const clients = [
  { name: "Frente Capital", consultor: "Lucia Perez" },
  { name: "Distrito Norte", consultor: "Mateo Diaz" },
  { name: "Cordoba Central", consultor: "Equipo Interno" },
];

export const ClientAssignmentsCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Clientes activos"
        title="Asignaciones"
        tag="Relacion"
        actions={<Button variant="outline">Nuevo cliente</Button>}
      />
      <div className="mt-5 space-y-3">
        {clients.map((client) => (
          <div
            key={client.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                Consultor asignado: {client.consultor}
              </p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">Activo</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
