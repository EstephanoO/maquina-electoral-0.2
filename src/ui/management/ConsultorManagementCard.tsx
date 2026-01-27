import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/ui/management/SectionHeader";

const consultors = [
  { name: "Lucia Perez", zone: "Centro" },
  { name: "Mateo Diaz", zone: "Norte" },
  { name: "Agustina Rios", zone: "Interior" },
];

export const ConsultorManagementCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Consultores"
        title="Equipo estrategico"
        tag="Admin only"
        actions={<Button>Invitar consultor</Button>}
      />
      <div className="mt-5 space-y-3">
        {consultors.map((consultor) => (
          <div
            key={consultor.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {consultor.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Zona: {consultor.zone}
              </p>
            </div>
            <Badge variant="outline">Activo</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
