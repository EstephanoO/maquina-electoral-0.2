import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/ui/management/SectionHeader";
import { ClientConfigDialog } from "@/ui/management/ClientConfigDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const clients = [
  { id: "guillermo", name: "Guillermo" },
  { id: "rocio", name: "Rocio" },
  { id: "giovanna", name: "Giovanna" },
];

export const ClientListCard = ({
  canAssignConsultor,
}: {
  canAssignConsultor: boolean;
}) => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Cartera activa"
        tag="3 activos"
      />
      <div className="mt-5 space-y-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                Dashboard y datos operativos
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canAssignConsultor ? (
                <Select defaultValue="consultor-a">
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Asignar consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultor-a">Lucia Perez</SelectItem>
                    <SelectItem value="consultor-b">Mateo Diaz</SelectItem>
                    <SelectItem value="consultor-c">Equipo interno</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              <Badge variant="outline">Activo</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/${client.id}/tierra`}>Ver dashboard</Link>
              </Button>
              <ClientConfigDialog clientName={client.name} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
