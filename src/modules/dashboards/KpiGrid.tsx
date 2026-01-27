import { Card } from "@/components/ui/card";

const kpis = [
  { label: "Intencion de voto", value: "41%", trend: "+3.2" },
  { label: "Cobertura territorial", value: "68%", trend: "+4.8" },
  { label: "Voluntariado activo", value: "2.460", trend: "+6.1" },
  { label: "Rendimiento digital", value: "74%", trend: "+2.1" },
];

export const KpiGrid = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border/60 bg-card/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-foreground">
              {kpi.value}
            </span>
            <span className="text-xs font-semibold text-primary">{kpi.trend}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div className="h-2 w-[65%] rounded-full bg-primary/70" />
          </div>
        </Card>
      ))}
    </div>
  );
};
