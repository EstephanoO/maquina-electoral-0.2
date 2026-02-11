# Diseño: Links de casa y local de votacion en INFO

## Contexto y objetivo
Se requiere que los flujos de INFO (Giovanna, Guillermo, Rocio) permitan guardar dos links por registro: el link de la casa del ciudadano y el link del local de votacion. El flujo debe ser unificado y no puede perder avances actuales.

## Decisiones clave
- Fuente unica: `forms` como base de registros, y `forms_operator_status` como estado por operador.
- Los links se almacenan como columnas nuevas en `forms_operator_status` (nullable) para no afectar registros existentes.
- Validacion: URLs opcionales, se acepta cualquier URL valida.
- UX: boton por fila que abre modal + indicador de cantidad de links en la fila.

## Modelo de datos
Agregar a `forms_operator_status`:
- `home_maps_url` (text, nullable)
- `polling_place_url` (text, nullable)

No se modifican los campos actuales (`contacted`, `replied`, `deleted`, `updated_at`). La migracion es aditiva.

## API
- `GET /api/forms-access`: incluir `homeMapsUrl` y `pollingPlaceUrl` por registro (merge con status).
- `PATCH /api/forms-access/status`: aceptar y persistir `homeMapsUrl` y `pollingPlaceUrl` opcionales, junto con el estado.

## UI/UX
- En cada fila, agregar boton “Links”.
- Indicador de links: badge “Sin links”, “1 link”, “2 links”.
- Modal con dos inputs (Casa, Local de votacion), placeholders de URL, validacion de formato si no estan vacios.
- Guardar actualiza optimistamente y dispara feedback de guardado existente.

## Migracion y compatibilidad
- Migracion aditiva (no elimina datos).
- Campos nuevos quedan en `NULL` para registros existentes.
- No se altera el flujo de estados ya en uso.

## Riesgos y mitigacion
- URLs mal formadas: validacion de formato en UI y en API (de ser necesario).
- Consistencia: mantener update atomico junto al estado en la misma tabla.

## Testing
- Verificar GET/PATCH de `forms-access` con y sin links.
- Verificar que el modal persiste y reabre con valores guardados.
- Verificar que no se rompe el estado de contacto existente.
