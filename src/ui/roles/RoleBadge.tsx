import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/roles/permissions";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  consultor: "Consultor",
  disenador: "Disenador",
  cliente: "Cliente",
};

export const RoleBadge = ({ role }: { role: UserRole }) => {
  return <Badge variant="outline">{roleLabels[role]}</Badge>;
};
