import { Card } from "@/ui/primitives/card";
import { Badge } from "@/ui/primitives/badge";

const assets = [
  { label: "Templates activos", value: "12" },
  { label: "Pendientes", value: "3" },
  { label: "Versiones", value: "8" },
];

export const CampaignAssetsSummary = () => {
  return (
    <Card className="panel fade-rise card-hover p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Assets
          </p>
          <h3 className="heading-display text-xl font-semibold text-foreground">
            Estado creativo
          </h3>
        </div>
        <Badge variant="outline">Demo</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {assets.map((asset) => (
          <div
            key={asset.label}
            className="rounded-xl border border-border/60 bg-background/70 p-3"
          >
            <p className="text-xs text-muted-foreground">{asset.label}</p>
            <p className="text-lg font-semibold text-foreground">{asset.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
