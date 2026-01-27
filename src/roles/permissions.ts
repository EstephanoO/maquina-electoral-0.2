export type UserRole = "admin" | "consultor" | "disenador" | "cliente";

export type PermissionKey =
  | "manageConsultors"
  | "manageDashboards"
  | "manageClients"
  | "manageDataUploads"
  | "manageGeojson"
  | "manageTasks"
  | "manageFileSystem";

const rolePermissions: Record<UserRole, PermissionKey[]> = {
  admin: [
    "manageConsultors",
    "manageDashboards",
    "manageClients",
    "manageDataUploads",
    "manageGeojson",
    "manageTasks",
    "manageFileSystem",
  ],
  consultor: [
    "manageDashboards",
    "manageClients",
    "manageDataUploads",
    "manageGeojson",
    "manageTasks",
    "manageFileSystem",
  ],
  disenador: ["manageTasks", "manageFileSystem"],
  cliente: [],
};

export const hasPermission = (role: UserRole, permission: PermissionKey) => {
  return rolePermissions[role].includes(permission);
};
