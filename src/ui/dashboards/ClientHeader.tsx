import { Card } from "@/ui/primitives/card";

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
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {templateLabel}
      </p>
    </Card>
  );
};
