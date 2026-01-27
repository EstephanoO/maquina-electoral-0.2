import type { AssetFile, AssetFolder } from "@/lib/types";

export const assetFolders: AssetFolder[] = [
  { id: "folder-root", name: "Assets" },
  { id: "folder-brand", name: "Brand", parentId: "folder-root" },
  { id: "folder-social", name: "Social", parentId: "folder-root" },
  { id: "folder-private", name: "Privado", parentId: "folder-root", readOnly: true },
];

export const assetFiles: AssetFile[] = [
  {
    id: "file-01",
    folderId: "folder-brand",
    name: "Logo_Master.ai",
    type: "vector",
    version: 1,
    updatedAt: "2026-01-12",
    comments: ["Version aprobada por el equipo"],
  },
  {
    id: "file-02",
    folderId: "folder-social",
    name: "Plantilla_Stories.psd",
    type: "template",
    version: 2,
    updatedAt: "2026-01-18",
    comments: ["Cambiar paleta a azul"],
  },
];
