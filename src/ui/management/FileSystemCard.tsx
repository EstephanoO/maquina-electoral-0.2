import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/ui/management/SectionHeader";

const folders = [
  { name: "Encuestas 2026", files: 12, access: "Privado" },
  { name: "Territorio", files: 8, access: "Equipo" },
  { name: "Prensa y narrativa", files: 15, access: "Publico" },
];

export const FileSystemCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Archivos"
        title="Drive estrategico"
        tag="Integrado"
        actions={<Button variant="outline">Conectar drive</Button>}
      />
      <div className="mt-5 space-y-3">
        {folders.map((folder) => (
          <div
            key={folder.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{folder.name}</p>
              <p className="text-xs text-muted-foreground">
                {folder.files} archivos · Acceso {folder.access}
              </p>
            </div>
            <Badge variant="outline">Sincronizado</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
