import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/ui/management/SectionHeader";

export const GeojsonCard = () => {
  return (
    <Card className="border-border/60 bg-card/70 p-6">
      <SectionHeader
        eyebrow="Mapas"
        title="Subir GeoJSON"
        tag="Territorio"
        actions={<Button variant="outline">Validar capas</Button>}
      />
      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <label
            htmlFor="geojson-file"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Archivo GeoJSON
          </label>
          <Input id="geojson-file" type="file" className="h-11" />
        </div>
        <div className="space-y-3">
          <label
            htmlFor="geojson-area"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Zona prioritaria
          </label>
          <Input id="geojson-area" placeholder="Distrito 7" className="h-11" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Usar para mapas de cobertura y calor electoral.</span>
        <Button size="sm">Publicar capa</Button>
      </div>
    </Card>
  );
};
