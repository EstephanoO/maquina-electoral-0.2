import { Card } from "@/components/ui/card";

export const UnauthorizedState = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="panel w-full max-w-md p-6 text-center">
        <p className="text-sm font-semibold text-foreground">No autorizado</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Tu rol actual no tiene permisos para ver esta seccion.
        </p>
      </Card>
    </div>
  );
};
