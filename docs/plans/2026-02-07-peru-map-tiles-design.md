# Peru Map Tiles (Fase 0)

## Objetivo
Reemplazar el render de GeoJSON grandes en cliente por vector tiles servidos desde una API propia con PostGIS para mejorar la carga inicial y la fluidez al cambiar niveles administrativos (departamento/provincia/distrito). El mapa debe seguir mostrando puntos, capas de cliente (GeoJSON de campaña) y controles de jerarquía.

## Arquitectura
- Nuevo source vector `peru-admin` que consume tiles `.pbf` desde `/api/tiles/peru/{z}/{x}/{y}`.
- Capas `departamentos`, `provincias` y `distritos` como layers vector con filtros por `CODDEP`, `CODPROV`, `UBIGEO`.
- Se mantiene `geoIndex` para nombres y bounds (sin cargar GeoJSON masivo).
- La capa de campaña (GeoJSON) se mantiene como `client-geojson` por ser chica.

## Flujo de datos
1) El mapa carga y solicita solo los tiles visibles.
2) La selección se resuelve desde las propiedades del tile (no `point-in-polygon`).
3) `geoIndex` aporta breadcrumb y bounds para `fitBounds`.
4) Los puntos siguen renderizados como `circle` layer.

## Errores y fallback
- Si faltan tiles, el mapa sigue funcionando (puntos y GeoJSON de campaña). Se mostrara un estado visual en la UI si es necesario.

## Testing
- Verificar requests `.pbf` en devtools.
- Confirmar que el cambio de nivel ya no bloquea el main thread.
- Probar clicks/hover en cada nivel.

## Limitaciones (fase 0)
- Se elimina el calculo `point-in-polygon` en cliente para resaltar por puntos. La seleccion por lista sigue enfocando el mapa pero no recalcula el conteo por zona.

## Pipeline de tiles (fase 1)
- PostGIS en Neon y tablas `peru_departamentos`, `peru_provincias`, `peru_distritos`.
- Script local `scripts/load-peru-geojson-to-postgis.sh` para cargar GeoJSON base.
- API `/api/tiles/peru/{z}/{x}/{y}` genera MVT on-the-fly.
