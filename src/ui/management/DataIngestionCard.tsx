import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/ui/management/SectionHeader";

export const DataIngestionCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Carga de datos"
        title="Subida rapida"
        tag="Excel y Sheets"
        actions={<Button variant="outline">Ver historico</Button>}
      />
      <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <label
            htmlFor="data-source"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Fuente de datos
          </label>
          <Select defaultValue="excel">
            <SelectTrigger id="data-source" className="h-11">
              <SelectValue placeholder="Elegir fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel local</SelectItem>
              <SelectItem value="sheets">Google Sheets</SelectItem>
              <SelectItem value="manual">Carga manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <label
            htmlFor="data-file"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Archivo
          </label>
          <Input id="data-file" type="file" className="h-11" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Campos planificados: region, edad, intencion de voto.</span>
        <Button size="sm">Procesar datos</Button>
      </div>
    </Card>
  );
};
