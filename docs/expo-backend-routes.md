# GOBERNA - Rutas Backend para Expo

Base URL
- https://dashboard.grupogoberna.com/api

Headers (todas las rutas)
- Content-Type: application/json

Notas
- Se acepta payload individual o array de objetos.
- Los query params tipo `on_conflict` se ignoran.
- Los ids locales se usan como `id` para upsert.

## 1) Entrevistas

Endpoint
- POST /forms

Payload
- nombre (string)
- telefono (string)
- fecha (string ISO)
- x (number)
- y (number)
- zona (string, ej: 18S)
- candidate (string)
- encuestador (string)
- encuestador_id (string)
- candidato_preferido (string)
- client_id (string)

Respuesta
- 201 { ok: true }

## 2) Tracking de ubicacion

Endpoint
- POST /interviewer_tracking

Payload
- id (string)
- event_id (string)
- interviewer (string)
- candidate (string)
- signature (string)
- interviewer_key (string)
- mode (string: moving|rest)
- tracked_at (string ISO)
- latitude (number)
- longitude (number)
- accuracy (number|null)
- altitude (number|null)
- speed (number|null)
- heading (number|null)

Respuesta
- 201 { ok: true }

## 3) Telemetria de estado de app

Endpoint
- POST /app_state_events

Payload
- id (string)
- signature (string)
- interviewer (string)
- candidate (string)
- app_state (string: active|inactive|background)
- timestamp (string ISO)
- is_connected (boolean|null)
- is_internet_reachable (boolean|null)
- connection_type (string|null)
- device_os (string|null)
- device_os_version (string|null)
- device_model (string|null)
- app_version (string|null)

Respuesta
- 202 { ok: true }
