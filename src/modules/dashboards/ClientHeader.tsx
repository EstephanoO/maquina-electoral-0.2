import { Card } from "@/components/ui/card";

const templateLabels: Record<string, string> = {
  tierra: "Tierra",
  mar: "Mar",
  aire: "Aire",
};

export const ClientHeader = ({
  activeId,
  activeTemplate,
}: {
  activeId: string;
  activeTemplate: string;
}) => {
  const templateLabel = templateLabels[activeTemplate] ?? activeTemplate;

  return (
    <Card className="border-border/60 bg-card/70 px-6 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {templateLabel}
      </p>
    </Card>
  );
};
