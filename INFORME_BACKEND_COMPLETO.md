# Informe completo de backend

## 1) Alcance y fuente de verdad

Este informe describe **como funciona hoy el backend real del repo** (no teoria), incluyendo:

- Arquitectura backend actual.
- Reglas de seguridad y de acceso.
- Modelo de datos y tablas.
- Catalogo de APIs (endpoints, metodos, validaciones, comportamiento).
- Reglas operativas que se repiten en todo el sistema.
- Riesgos/deuda tecnica visible en el codigo.

Fuente principal usada:

- `AGENTS.md` (raiz) y `src/*/AGENTS.md`.
- Rutas `src/app/api/**/route.ts`.
- Auth/sesion en `src/lib/auth/*`.
- Seguridad HTTP en `src/lib/api/*`.
- Esquema Drizzle en `src/db/schema.ts`.
- Conexion DB en `src/db/connection*.ts` y realtime en `src/db/realtime*.ts`.

---

## 2) Arquitectura backend (real)

### Stack

- Next.js App Router con Route Handlers (`src/app/api/...`).
- TypeScript strict.
- Drizzle ORM sobre Neon Postgres (`drizzle-orm/neon-http`).
- Realtime puntual via `pg_notify` + `LISTEN/UNLISTEN` (SSE en endpoint de stream).
- Cache de tiles con memoria en proceso + Vercel KV (si hay credenciales).

### Distribucion por capas

- **Capa HTTP/API**: `src/app/api/**/route.ts`.
- **Capa datos**: `src/db/schema.ts` + `src/db/connection.ts` + `src/db/connection-info.ts`.
- **Auth/sesion**: `src/lib/auth/*` + rutas `/api/auth/*` + guards server-side en layouts.
- **Reglas de seguridad API**: `src/lib/api/auth.ts`, `src/lib/api/http.ts`, `src/lib/api/idempotency.ts`.
- **RBAC de consola/dominio**: `src/lib/rbac.ts` (modelo de permisos por rol/accion/sujeto).

### Dos conexiones de base de datos

Hay una separacion operativa:

- `db` (`src/db/connection.ts`): usa `DATABASE_URL3 ?? DATABASE_URL2 ?? DATABASE_URL`.
- `dbInfo` (`src/db/connection-info.ts`): usa `DATABASE_URL3 ?? DATABASE_URL2`.

Traduccion practica:

- El modulo `info/8-febrero`, `forms-access`, `operators` y `forms-map` corre contra `dbInfo`.
- El resto de APIs nucleares usan `db`.

---

## 3) Flujo de autenticacion y sesion

## Credenciales y login

- Endpoint: `POST /api/auth/login`.
- Busca usuario por email en `auth_users`.
- Si `password_hash` es null, hace bootstrap de password (min 6) y guarda hash `scrypt`.
- Si existe hash, valida con `verifyPassword` + `timingSafeEqual`.
- Crea sesion en `auth_sessions` con token random y expiracion 30 dias.
- Setea cookie `maquina_session` (httpOnly, sameSite=lax, secure en prod).

## Sesion activa

- `GET /api/auth/me` devuelve `{ user }` (o `null`).
- `POST /api/auth/logout` revoca token en DB y limpia cookie.

## Guardas server-side

- `src/app/console/layout.tsx`: si no hay sesion -> `/login`; si no es admin -> `/dashboard`.
- `src/app/(app)/dashboard/layout.tsx`: permite `candidato` y `admin`; el resto va a `/console/campaigns`.
- `src/app/info/(protected)/layout.tsx`: exige usuario del dominio info (`isInfoUserEmail`).

## Hidratacion cliente

- `src/shared/SessionHydrator.tsx` llama `/api/auth/me` al montar y sincroniza store Zustand.

## Nota importante de modelo de rol

Hay dos universos de roles coexistiendo:

- Sesion auth: `admin | candidato` (`src/lib/auth/types.ts`).
- RBAC de dominio: `SUPER_ADMIN | CONSULTOR | CANDIDATO | ...` (`src/lib/types.ts`, `src/lib/rbac.ts`).

La app hoy mapea `admin -> SUPER_ADMIN` y `candidato -> CANDIDATO` en store de sesion.

---

## 4) Reglas de seguridad transversales

## Reglas de origen y API keys (ingesta/eventos)

En rutas de ingesta (`/api/forms`, `/api/interviewer_tracking`, `/api/app_state_events`, `/api/ws-events`):

- `isOriginAllowed(origin)` contra `API_ALLOWED_ORIGINS` (csv).
- `isApiKeyValid(request)` contra `API_PUBLIC_KEYS` (csv, header `x-api-key`).

Si no hay env configurado para esas listas, el codigo actualmente cae en modo permisivo.

## Telemetria v1

`/api/v1/telemetry/app-state` valida por:

- `x-api-key == TELEMETRY_API_KEY` o
- `Authorization: Bearer <token>` con `TELEMETRY_BEARER_TOKEN`.

Ademas aplica rate limit in-memory por `signature` (60 eventos/min).

## Google auth route

Ruta fuera de `/api`: `POST /auth/google`.

- Valida CORS contra `AUTH_ALLOWED_ORIGINS`.
- Verifica `idToken` con JWKS de Google y `GOOGLE_CLIENT_ID`.
- Crea usuario si no existe y abre sesion con cookie igual al login normal.

## Request observability

Las rutas de ingesta usan:

- `x-request-id` (propaga o genera UUID).
- `jsonResponse(...)` que devuelve ese header.
- `logApiEvent(...)` con JSON estructurado (`type: api`, status, duration, errorCode, itemsCount).

---

## 5) Modelo de datos (tablas principales)

Definido en `src/db/schema.ts`.

## Core operativo

- `territory`: entrevistas georreferenciadas (lat/lng + UTM + metadata).
- `forms`: formularios normalizados (nombre, telefono, candidato, encuestador, coordenadas x/y/zona).
- `campaign_geojson`: capas GeoJSON por `campaign_id + layer_type`.
- `interviewer_tracking`: trazas de ubicacion por entrevistador.
- `app_state_events`: historial de estado de app (active/inactive/background).
- `app_state_current`: snapshot actual por `signature`.

## Auth

- `auth_users`: usuarios, rol, password hash, campaign asignada.
- `auth_sessions`: token de sesion, expiracion, user_id.

## Modulo info/operadores

- `info_feb8_status`, `info_feb8_action_events`.
- `info_feb8_status_guillermo`, `info_feb8_registros_guillermo`.
- `info_feb8_status_giovanna`, `info_feb8_registros_giovanna`.
- `operators`.
- `forms_operator_access` (habilitaciones).
- `forms_operator_status` (estado por operador+form).

## Indices y constraints clave

- `campaign_geojson`: PK compuesta (`campaign_id`, `layer_type`).
- `forms_operator_access`: unique (`form_id`, `operator_id`).
- `forms_operator_status`: PK compuesta (`form_id`, `operator_id`).
- Indices para consultas por `client_id`, `signature`, `operator`, `created_at`, etc.

---

## 6) Catalogo de APIs

## A. Auth y sesion

### `POST /api/auth/login`

- Body: `{ email, password }`.
- 400 si faltan credenciales.
- 401 si invalidas.
- 200 con `{ ok: true }` y cookie de sesion.

### `GET /api/auth/me`

- Devuelve `{ user }` usando cookie `maquina_session`.

### `POST /api/auth/logout`

- Revoca sesion y borra cookie.

### `POST /auth/google` y `OPTIONS /auth/google`

- Login federado con Google ID token + CORS controlado.

### `GET /api/health`

- Healthcheck simple `{ ok: true }` + logging API.

---

## B. Entrevistas y territorio

### `POST /api/interviews`

- Inserta en `territory`.
- Acepta coordenadas directas o UTM (convierte a lat/lng en ciertos casos).
- `onConflictDoNothing()` por id.

### `GET /api/interviews`

- Filtros: `candidate`, `client`, `startDate`, `endDate`.
- Devuelve `points`.
- Puede derivar lat/lng desde `location` UTM si faltan columnas directas.
- Soporta mock para `client=cesar-vasquez`.

### `PATCH /api/interviews`

- Update parcial (`candidate`, `name`, `phone`) por `id`.

### `DELETE /api/interviews?id=...`

- Elimina registro de `territory`.

### `GET /api/territory-summary`

- Resume actividad del dia mas reciente (perCandidate, perHour, top/low interviewers).
- Filtro opcional por `client`/`candidate`.

---

## C. Geoespacial y mapas

### `GET /api/geojson`

- Parametros: `client|campaignId`, `layerType`, `meta=1`.
- Capas soportadas: `departamento|provincia|distrito|nivel4`.
- Cache headers para CDN.

### `POST /api/geojson`

- Upsert de capa GeoJSON por campana/tipo.
- Valida `FeatureCollection` y limite de features.
- Deriva `meta` (bbox, conteos y codigos) y guarda geom consolidada via SQL/PostGIS.

### `DELETE /api/geojson`

- Borra capa puntual o toda la campana.

### `GET /api/tiles/peru/[z]/[x]/[y]?layer=&v=`

- Sirve vector tiles MVT de Peru (departamentos/provincias/distritos/all).
- Cache por:
  - LRU en memoria del proceso.
  - Vercel KV si `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
- 204 para tile vacio/no aplicable; 200 con `application/x-protobuf`.

### `GET /api/interview-department-summary`

- Conteo de entrevistas por departamento via interseccion espacial.

### `GET /api/interview-districts`

- Lista de ubigeos de distritos tocados por entrevistas.

### `GET /api/interview-selection-count`

- Conteo para seleccion territorial puntual segun `level=departamento|provincia|distrito`.

---

## D. Formularios y operadores

### `POST /api/forms`

- Endpoint de ingesta principal con API key/origin.
- Acepta item unico o array.
- Valida campos obligatorios de formulario.
- Upsert en `forms` por `client_id`.
- Upsert espejo en `territory` para consumo geoespacial.

### `GET /api/forms-map`

- Lee `forms` + `territory` y devuelve `points` listos para mapa.
- Deriva lat/lng si solo hay UTM/zona.

### `GET /api/operators`

- Lista operadores activos (o inactivos con `includeInactive=1`).

### `GET /api/forms-access`

- Requiere `operatorId` o `operatorSlug`.
- Devuelve forms habilitados + estados por operador.

### `POST /api/forms-access`

- Habilita acceso operador-form(s) por `operatorIds` o `operatorSlug`, y `formIds` o `clientIds`.

### `DELETE /api/forms-access`

- Revoca habilitaciones operador-form.

### `PATCH /api/forms-access/status`

- Upsert de estado por par (`formId`, `operatorId`): contacted/replied/deleted + links.

### `GET /api/forms-access/enabled`

- Devuelve lista de `clientIds` con acceso habilitado.

---

## E. Tracking y telemetria

### `POST /api/interviewer_tracking`

- Ingesta robusta (api key + origin + idempotencia por `buildStableId`).
- Acepta item o array.
- Upsert por `id`.

### `POST /api/interviewer-tracking` y `GET /api/interviewer-tracking`

- Variante legacy/no unificada.
- `POST` inserta tracking.
- `GET` consulta ultimo punto por entrevistador o historial corto (`includePrevious=1`).

### `POST /api/app_state_events`

- Ingesta app state legacy (api key + origin + idempotencia).
- Upsert en `app_state_events` y `app_state_current`.

### `POST /api/v1/telemetry/app-state`

- Version mas estricta de telemetria:
  - auth dedicada (API key o bearer).
  - rate limit por signature.
  - dedupe con `onConflictDoNothing`.

### `GET /api/v1/telemetry/app-state`

- Consulta snapshots `app_state_current` por `signature`(s).

### `POST /api/ws-events`

- Multiplexor de ingesta para `interviewer_tracking` o `app_state_events`.
- Permite payload unico o array por tipo.

---

## F. Modulo INFO (8-febrero)

## Seguridad del modulo

- Casi todo valida sesion + dominio info (`isInfoUserEmail`).
- Ciertos flujos distinguen admin (`isInfoAdminEmail`).

### `GET /api/info/8-febrero`

- Devuelve `records` + `statuses` fusionando formularios y estados/acciones.
- Si no sos admin, ves solo lo asignado a tu usuario o lo no asignado.

### `POST /api/info/8-febrero`

- Crea contacto manual en `forms`.
- Emite realtime `new_record` por `pg_notify`.

### `DELETE /api/info/8-febrero?id=...`

- Elimina registro form por id.

### `PATCH /api/info/8-febrero/status`

- Actualiza estado contactado/respondio/eliminado.
- Reglas:
  - No reply sin contacted.
  - Operador no admin solo toca lo que tiene asignado.
  - Para marcar contacted/replied primero exige lock (whatsapp abierto/asignado).
- Tambien permite update de links (`homeMapsUrl`, `pollingPlaceUrl`, `linksComment`).
- Emite realtime `status`.

### `POST /api/info/8-febrero/assign`

- Lock/unlock de registro por usuario operador.
- Previene pisado concurrente (409 Locked).
- Emite realtime `assignment`.

### `GET /api/info/8-febrero/actions`

- Metricas por operador/accion (resumen, unicos, timers, recientes).
- Rangos: `today|7d|30d`.

### `POST /api/info/8-febrero/actions`

- Registra evento de accion (`no_hablado`, `hablado`, `contestado`, `eliminado`, `whatsapp`, etc.).

### `GET /api/info/8-febrero/stream`

- SSE realtime para status/asignacion/nuevo registro.
- Backend usa `LISTEN info_feb8_status` y heartbeat `ping` cada 25s.

### `GET/PATCH/DELETE` de variantes por candidato

- `.../guillermo/*` y `.../giovanna/*` manejan sus tablas especificas de registros/status.

### `GET/POST/PATCH /api/info/users`

- Gestion de usuarios info por admin:
  - listar,
  - crear,
  - resetear password (`passwordHash = null`).

---

## G. Otros endpoints

### `GET /api/landings`

- Fetch remoto de TSV y parseo server-side.

---

## 7) Reglas operativas de consistencia de datos

Estas reglas se repiten y son importantes:

- **Idempotencia**: varios endpoints generan ID estable por hash (`buildStableId`) para evitar duplicados por reintento.
- **Upsert sistematico**: uso de `onConflictDoUpdate` o `onConflictDoNothing` en ingesta.
- **Payload flexible**: endpoints de ingesta aceptan objeto unico o array.
- **Normalizacion**: trimming, casteo numerico, parseo de fecha, normalizacion de candidato.
- **Derivacion geoespacial**: si no hay lat/lng, se intenta derivar desde UTM/location/zona.
- **Respuestas estandarizadas**: varias rutas devuelven `ok/error` + status HTTP consistente.

---

## 8) Variables de entorno detectadas (sin valores)

- DB: `DATABASE_URL`, `DATABASE_URL2`, `DATABASE_URL3`.
- Seguridad API: `API_ALLOWED_ORIGINS`, `API_PUBLIC_KEYS`.
- Telemetria v1: `TELEMETRY_API_KEY`, `TELEMETRY_BEARER_TOKEN`.
- Google auth: `GOOGLE_CLIENT_ID`, `AUTH_ALLOWED_ORIGINS`.
- Runtime prod flag: `NODE_ENV`.
- Cache tiles: `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
- Cliente WS (frontend): `NEXT_PUBLIC_WS_EVENTS_URL`.

---

## 9) Riesgos y deuda tecnica (hallazgos concretos)

## 1) Endpoints duplicados de tracking/app-state

- Coexisten rutas nuevas y legacy (`/api/interviewer_tracking` vs `/api/interviewer-tracking`, `/api/app_state_events` vs `/api/v1/telemetry/app-state`).
- Riesgo: comportamiento divergente, doble mantenimiento y criterios de auth distintos.

## 2) Doble modelo de rol

- Auth maneja `admin|candidato`, RBAC maneja enum mas amplio.
- Riesgo: reglas de permisos incompletas o mapeos inesperados al crecer roles.

## 3) Permisividad por default en seguridad de ingesta

- Si faltan `API_ALLOWED_ORIGINS` o `API_PUBLIC_KEYS`, varias rutas quedan abiertas por default.
- Riesgo: ingestas no autenticadas en despliegues mal configurados.

## 4) Rate limit en memoria local

- `v1/telemetry/app-state` limita en `Map` in-memory por instancia.
- Riesgo: en horizontal scaling no hay limite global real.

## 5) Divergencia AGENTS vs codigo

- `AGENTS.md` menciona rutas clave como `/api/events/route.ts` que hoy no existen.
- Riesgo: documentacion de arquitectura desfasada para onboarding.

---

## 10) Reglas practicas para tocar backend sin romperlo

- Mantener patron de validacion + normalizacion antes de escribir DB.
- Si endpoint es de ingesta externa, mantener `x-request-id`, logging estructurado y controles origin/key.
- Para writes de volumen o reintentos, conservar idempotencia.
- No mezclar internals entre modulos; usar APIs publicas y respetar aislamiento del modulo.
- En cambios geoespaciales, preservar contratos de `campaign_geojson` y tile cache.
- En auth, priorizar guardas server-side (layouts/route handlers), no solo chequeos cliente.

---

## 11) Inventario rapido de rutas backend

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /auth/google`

### Core entrevistas/geo

- `POST|GET|PATCH|DELETE /api/interviews`
- `GET /api/territory-summary`
- `GET|POST|DELETE /api/geojson`
- `GET /api/tiles/peru/[z]/[x]/[y]`
- `GET /api/interview-department-summary`
- `GET /api/interview-districts`
- `GET /api/interview-selection-count`

### Ingesta/formularios/operadores

- `POST /api/forms`
- `GET /api/forms-map`
- `GET /api/operators`
- `GET|POST|DELETE /api/forms-access`
- `PATCH /api/forms-access/status`
- `GET /api/forms-access/enabled`

### Tracking/telemetria

- `POST /api/interviewer_tracking`
- `POST|GET /api/interviewer-tracking`
- `POST /api/app_state_events`
- `POST|GET /api/v1/telemetry/app-state`
- `POST /api/ws-events`

### Info 8-febrero

- `GET|POST|DELETE /api/info/8-febrero`
- `PATCH /api/info/8-febrero/status`
- `POST /api/info/8-febrero/assign`
- `GET|POST /api/info/8-febrero/actions`
- `GET /api/info/8-febrero/stream`
- `GET|DELETE /api/info/8-febrero/guillermo`
- `PATCH /api/info/8-febrero/guillermo/status`
- `GET|DELETE /api/info/8-febrero/giovanna`
- `PATCH /api/info/8-febrero/giovanna/status`
- `GET|POST|PATCH /api/info/users`

### Otros

- `GET /api/health`
- `GET /api/landings`

---

## 12) Conclusiones ejecutivas

- El backend esta funcional y orientado a operacion real (ingesta, geodata, trazas, panel info con realtime).
- La base de datos y las rutas muestran un enfoque pragmatico: upsert, dedupe, conversion geoespacial y filtros por cliente/candidato.
- El punto mas delicado no es capacidad tecnica, es **consistencia arquitectonica**: hoy hay duplicados legacy/nuevo en tracking y app-state, mas diferencias de seguridad por endpoint.
- Si queres robustez enterprise, el siguiente paso no es meter mas features; es consolidar contratos de API, auth y versionado.
