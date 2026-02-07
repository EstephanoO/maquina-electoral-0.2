"use client";

import * as React from "react";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";
import { useAssetsStore } from "@/stores/assets.store";
import { EmptyState } from "@/ui/shared/EmptyState";
import { RoleGate } from "@/shared/RoleGate";
import { toast } from "sonner";

export default function AssetsPage() {
  const folders = useAssetsStore((state) => state.folders);
  const files = useAssetsStore((state) => state.files);
  const activeFolderId = useAssetsStore((state) => state.activeFolderId);
  const setActiveFolder = useAssetsStore((state) => state.setActiveFolder);
  const createFolder = useAssetsStore((state) => state.createFolder);
  const uploadFileMock = useAssetsStore((state) => state.uploadFileMock);
  const bumpVersion = useAssetsStore((state) => state.bumpVersion);
  const addCommentMock = useAssetsStore((state) => state.addCommentMock);
  const [newFolder, setNewFolder] = React.useState("");
  const [newFile, setNewFile] = React.useState("");

  const activeFiles = files.filter((file) => file.folderId === activeFolderId);

  const handleFolder = () => {
    if (!newFolder) return;
    createFolder(newFolder, activeFolderId);
    setNewFolder("");
    toast.success("Carpeta creada");
  };

  const handleUpload = () => {
    if (!newFile) return;
    uploadFileMock(activeFolderId, newFile);
    setNewFile("");
    toast.success("Archivo cargado");
  };

  return (
    <RoleGate action="view" subject="asset">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6 stagger-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Drive
              </p>
              <h2 className="text-2xl font-semibold text-foreground">Repositorio creativo</h2>
            </div>
          </div>
        </Card>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
          <Card className="panel fade-rise card-hover p-4 stagger-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Carpetas
            </p>
            <div className="mt-3 space-y-2">
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={folder.id === activeFolderId ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFolder(folder.id)}
                >
                  {folder.name}
                </Button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Nueva carpeta"
                value={newFolder}
                onChange={(event) => setNewFolder(event.target.value)}
              />
              <Button size="sm" onClick={handleFolder}>
                Crear carpeta
              </Button>
            </div>
          </Card>
          <Card className="panel fade-rise card-hover p-4 stagger-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Archivos
              </p>
              <Badge variant="outline">{activeFiles.length}</Badge>
            </div>
            {activeFiles.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Sin archivos"
                  description="Carga un archivo para comenzar."
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {activeFiles.map((file) => (
                  <Card
                    key={file.id}
                    className="border-border/60 bg-background/70 p-3 shadow-sm fade-rise card-hover"
                  >
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      v{file.version} · {file.updatedAt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => bumpVersion(file.id)}>
                        Bump version
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addCommentMock(file.id, "Comentario agregado")}
                      >
                        Comentar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Nuevo archivo"
                value={newFile}
                onChange={(event) => setNewFile(event.target.value)}
              />
              <Button size="sm" onClick={handleUpload}>
                Subir archivo
              </Button>
            </div>
          </Card>
          <Card className="panel fade-rise card-hover p-4 stagger-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Selecciona un archivo para ver metadata, comentarios y versiones.
            </p>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
