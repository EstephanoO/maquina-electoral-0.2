import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dashboards = [
  { title: "Tierra", status: "Disponible" },
  { title: "Mar", status: "Disponible" },
  { title: "Aire", status: "Disponible" },
];

export const DashboardCatalog = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plantillas
          </p>
          <p className="text-lg font-semibold text-foreground">
            Dashboards por territorio
          </p>
        </div>
        <Badge variant="outline">UI Only</Badge>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.title}
            className="rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              {dashboard.title}
            </p>
            <p className="text-xs text-foreground/70">Estado: {dashboard.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
