import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const mapCatalog = [
  "Mapa territorial",
  "Mapa de calor",
  "Mapa de recorridos",
];

export const ClientConfigDialog = ({ clientName }: { clientName: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Configurar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar dashboard · {clientName}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="contactos" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="mapas">Mapas</TabsTrigger>
            <TabsTrigger value="archivos">Archivos</TabsTrigger>
          </TabsList>
          <TabsContent value="contactos" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor={`contacts-${clientName}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Excel de contactos (nombre + celular)
              </label>
              <Input id={`contacts-${clientName}`} type="file" className="h-11" />
            </div>
            <Textarea
              placeholder="Notas de segmentacion o instrucciones de carga"
              className="min-h-[120px]"
            />
            <Button size="sm">Actualizar dashboard</Button>
          </TabsContent>
          <TabsContent value="mapas" className="mt-4 space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Catalogo de mapas visibles
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {mapCatalog.map((map) => {
                  const mapId = `${clientName}-${map}`.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <div key={map} className="flex items-center gap-2 text-sm">
                      <Checkbox id={mapId} />
                      <label htmlFor={mapId}>{map}</label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor={`geojson-${clientName}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Subir GeoJSON
                </label>
                <Input id={`geojson-${clientName}`} type="file" className="h-11" />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`qml-${clientName}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Subir QML
                </label>
                <Input id={`qml-${clientName}`} type="file" className="h-11" />
              </div>
            </div>
            <Button size="sm">Guardar configuracion</Button>
          </TabsContent>
          <TabsContent value="archivos" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor={`drive-${clientName}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Vincular carpeta de drive
              </label>
              <Input id={`drive-${clientName}`} placeholder="URL de carpeta" className="h-11" />
            </div>
            <Textarea
              placeholder="Notas para disenadores y assets requeridos"
              className="min-h-[120px]"
            />
            <Button size="sm">Sincronizar archivos</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
