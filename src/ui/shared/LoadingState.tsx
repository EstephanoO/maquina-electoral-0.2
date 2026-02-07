import { Card } from "@/ui/primitives/card";
import { Skeleton } from "@/ui/primitives/skeleton";

export const LoadingState = ({ title }: { title?: string }) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="panel w-full max-w-md p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <p className="text-sm text-muted-foreground">
            {title ?? "Cargando"}
          </p>
        </div>
      </Card>
    </div>
  );
};
