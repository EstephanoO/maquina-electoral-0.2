import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Favorabilidad", value: "64%" },
  { label: "Intencion voto", value: "41%" },
  { label: "Voluntariado", value: "2.4k" },
  { label: "Ritmo digital", value: "+12%" },
];

export const CampaignInsights = () => {
  return (
    <Card className="panel fade-rise card-hover p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Insights
      </p>
      <h3 className="heading-display text-xl font-semibold text-foreground">
        Senales clave
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border/60 bg-background/70 p-3"
          >
            <p className="text-xs text-foreground/70">{metric.label}</p>
            <p className="text-lg font-semibold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
