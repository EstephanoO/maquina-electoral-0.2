import { Card } from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";

export const ErrorState = ({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="panel w-full max-w-md p-6 text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
            Reintentar
          </Button>
        ) : null}
      </Card>
    </div>
  );
};
