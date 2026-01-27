import { Card } from "@/components/ui/card";

export const UnauthorizedState = () => {
  return (
    <Card className="panel p-6">
      <p className="text-sm font-semibold text-foreground">No autorizado</p>
      <p className="text-xs text-muted-foreground">
        Tu rol actual no tiene permisos para ver esta seccion.
      </p>
    </Card>
  );
};
