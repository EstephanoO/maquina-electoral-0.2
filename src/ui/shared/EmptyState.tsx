import { Card } from "@/ui/primitives/card";

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="panel w-full max-w-md border-dashed p-6 text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
};
