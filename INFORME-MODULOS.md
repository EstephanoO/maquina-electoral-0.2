# Informe Completo: Modulos Tierra e INFO Giovanna

> Generado: 16 Feb 2026 | Repo: maquina-electoral-0.2

---

## Tabla de Contenidos

1. [Modulo Tierra (Dashboard de Campo)](#modulo-tierra)
2. [Modulo INFO Giovanna (Operadora de Contactos)](#modulo-info-giovanna)

---

# Modulo Tierra

**Ruta:** `/dashboard/[client]/tierra`
**Archivo entrada:** `src/app/(app)/dashboard/[client]/tierra/page.tsx`

## 1. Proposito

Dashboard de guerra en tiempo real para visualizar y gestionar entrevistas de campo en un mapa interactivo del Peru. Muestra la ubicacion de entrevistadores, registros de entrevistas, metricas de progreso y tracking GPS en vivo.

## 2. Arbol de Componentes

```
page.tsx (Server Component, async)
  DashboardAccessGate (control de acceso)
    EventTierraDashboard (client component)
      EventMapDashboard (dynamic import, SSR=false)
        EventMapDashboardView
          [HEADER]
            CandidateIdentityBlock (avatar, nombre, partido)
            MetaDataProgress (barra de progreso datos)
            MetaVotesProgress (barra de progreso votos)
            Toggle Tracking/Datos
            EventRecordsDialog (tabla completa en dialog)
          [MAPA - columna principal]
            MapSection
              PeruMapPanel (dynamic, SSR=false)
                MapPanel (wrapper MapLibre GL JS)
                  MaplibreMap (@vis.gl/react-maplibre)
                  Source + Layer (GeoJSON overlays)
                MapHierarchyTileLayers (tiles vectoriales Peru)
                MapHierarchyControls (breadcrumb navegacion)
            InterviewerTimelineChart (Recharts, dynamic)
          [SIDEBAR - 360px]
            Top Agents Card (ranking)
            Field Agents Card (status en vivo)
            Operational Log Card (feed de actividad)
```

## 3. Archivos Principales

| Archivo | Rol |
|---|---|
| `src/app/(app)/dashboard/[client]/tierra/page.tsx` | Entrada de ruta |
| `src/ui/dashboards/DashboardAccessGate.tsx` | Control de acceso |
| `src/ui/dashboards/events/EventTierraDashboard.tsx` | Wrapper client |
| `src/dashboards/events/containers/EventMapDashboard.tsx` | Container principal |
| `src/ui/dashboards/events/EventMapDashboardView.tsx` | Vista completa |
| `src/ui/dashboards/events/components/MapSection.tsx` | Wrapper del mapa |
| `src/ui/maps/PeruMapPanel.tsx` | Mapa Peru con jerarquia |
| `src/ui/maps/MapPanel.tsx` | Core MapLibre wrapper |
| `src/ui/maps/hierarchy/MapHierarchyTileLayers.tsx` | Capas de tiles vectoriales |
| `src/ui/maps/hierarchy/MapHierarchyControls.tsx` | Controles breadcrumb |
| `src/ui/dashboards/events/EventRecordsDialog.tsx` | Tabla de datos completa |
| `src/ui/dashboards/events/components/InterviewerTimelineChart.tsx` | Grafico timeline |

## 4. Flujo de Datos

### APIs y Endpoints

| Endpoint | Tabla DB | Refresh | Proposito |
|---|---|---|---|
| `/api/interviews` | `territory` | SWR 8s | CRUD de registros de entrevistas |
| `/api/territory-summary` | `territory` | SWR 10s | Resumen: totales, top entrevistadores, por hora |
| `/api/interview-districts` | `territory` | SWR 15s | Distritos con entrevistas |
| `/api/interview-department-summary` | `territory` | SWR 15s | Conteos por departamento |
| `/api/interview-selection-count` | `territory` | SWR 15s | Conteo para seleccion geografica |
| `/api/geojson?campaignId=` | `campaign_geojson` | SWR | Capas GeoJSON por campana |
| `/api/v1/telemetry/app-state` | `app_state_current` | SWR | Estado de dispositivos de campo |
| `/api/interviewer-tracking` | via backend | SWR 5s | Tracking GPS de entrevistadores |
| SSE `NEXT_PUBLIC_WS_EVENTS_URL` | EventSource | Real-time | Stream GPS + telemetria |

### Hooks Principales

| Hook | Archivo | Proposito |
|---|---|---|
| `useEventData` | `src/dashboards/events/hooks/useEventData.ts` | Datos de entrevistas (SWR 8s) |
| `useInterviewerTracking` | `src/dashboards/events/hooks/useInterviewerTracking.ts` | Tracking GPS (SWR 5s) |
| `useRealtimeTrackingStream` | `src/dashboards/events/hooks/useRealtimeTrackingStream.ts` | SSE para tracking live |
| `useTrackingStatus` | `src/dashboards/events/hooks/useTrackingStatus.ts` | Computa status: connected/stationary/inactive |
| `useCandidateVisibility` | `src/dashboards/events/hooks/useCandidateVisibility.ts` | Toggle visibilidad puntos por candidato |
| `useMapHierarchy` | `src/maps/hierarchy/useMapHierarchy.ts` | Maquina de estados para drill-down geografico |

## 5. Integracion de Mapa

### Stack de Capas

1. **MapPanel** - Wrapper core de `@vis.gl/react-maplibre` con MapLibre GL JS
2. **PeruMapPanel** - Mapa Peru con navegacion administrativa
3. **MapHierarchyTileLayers** - Tiles vectoriales de limites administrativos (`/api/tiles/peru/{z}/{x}/{y}`)
4. **MapSection** - Gestion de capas GeoJSON por campana

### Estilos de Mapa

| Estilo | Fuente | Uso |
|---|---|---|
| Light | CARTO Positron | Modo claro |
| Dark | CARTO Dark Matter | Modo oscuro |
| Peru | Estilo custom vacio | Vista sin calles |

### Tiles Vectoriales (3 niveles)

- **Departamentos** (z0-z10) - 25 departamentos
- **Provincias** (z6-z12) - dentro del departamento seleccionado
- **Distritos** (z8-z13) - dentro de la provincia seleccionada

### Capas GeoJSON por Candidato

| Candidato | Fuente | Niveles |
|---|---|---|
| Guillermo | `/api/geojson?campaignId=cand-guillermo` | 3 niveles (dep/prov/dist) |
| Giovanna | Archivos estaticos `/geo/*_giovanna.geojson` | 5 niveles (abuelo/padre/hijo/nieto/bisnieto) |
| Rocio | Archivos estaticos `/geo/*_rocio.geojson` | 3 niveles + prioridad |

### Renderizado de Puntos

Los puntos se renderizan como **GeoJSON circle layers** (no markers individuales) para performance:

| Tipo | Radio | Color |
|---|---|---|
| Tracking (connected) | 4px | `#10b981` (emerald) |
| Tracking (stationary) | 4px | `#f97316` (orange) |
| Tracking (inactive) | 4px | `#94a3b8` (slate) |
| Interview (candidato 1) | 5px | `#10b981` |
| Interview (candidato 2) | 5px | `#3b82f6` |
| Interview (candidato 3) | 5px | `#f97316` |
| Online pulse | 18px | blue, opacity 0.22 |

### Drill-Down Geografico (Maquina de Estados)

```
departamento -> click -> provincia -> click -> distrito
                                                  |
                                        Giovanna: -> sector -> subsector
```

Navegacion: breadcrumb con botones Volver/Salir via `MapHierarchyControls`.

## 6. Secciones de UI

### Header (ancho completo)

- **Identidad del candidato**: avatar, nombre, partido, rol, numero
- **Meta de datos**: barra de progreso `actual/objetivo` con porcentaje
- **Meta de votos**: barra de progreso (oculta para Rocio)
- **Toggle Tracking/Datos**: cambia modo del mapa (GPS vs entrevistas)
- **"Ver datos"**: abre tabla completa en Dialog
- **"Ver inboxs"**: navega a `/info/cesar-vasquez`

### Sidebar Derecho (360px)

**Card 1 - Top Agents**: Top 5 entrevistadores rankeados por cantidad, barras de progreso horizontales.

**Card 2 - Field Agents**: Monitoreo en tiempo real. Indicadores color por estado. Click en agente -> mapa vuela a su ubicacion.

**Card 3 - Operational Log**: Ultimos 5 registros enviados. Click -> mapa vuela al punto. "Ver mas" abre Dialog con los ultimos 50.

### Debajo del Mapa

**Interviewer Timeline Chart**: Grafico de lineas (Recharts) con actividad horaria de los top-3 entrevistadores. Toggle dia/semana.

## 7. Interactividad

### Mapa

| Accion | Efecto |
|---|---|
| Click departamento | Drill down a provincias, fit bounds |
| Click provincia | Drill down a distritos, fit bounds |
| Click distrito | Selecciona distrito, muestra sectores (Giovanna) |
| Click sector/subsector | Aisla area, muestra detalle |
| Click area vacia | Vuelve un nivel o reset |
| Hover regiones | Highlight borde, cursor pointer |
| Fullscreen | API nativa fullscreen |
| Tooltip punto | Info agente (modo, velocidad) o entrevista (nombre, telefono) |

### Tabla de Datos (EventRecordsDialog)

- **Ordenamiento** por columna (via @tanstack/react-table)
- **Busqueda** por nombre, telefono, candidato
- **Filtro** por candidato (dropdown)
- **Toggle columnas** visibles
- **Paginacion** configurable (10/20/50)
- **Descarga CSV** de datos filtrados
- **Editar** registro (dialog inline)
- **Eliminar** registro
- **Centrar en mapa** (vuela al punto, cierra dialog)

## 8. Estado

### Zustand Stores

| Store | Archivo | Persist | Proposito |
|---|---|---|---|
| `useCampaignsStore` | `src/campaigns/store.ts` | localStorage `maquina-campaigns` | Campanas, dashboards, perfiles |
| `useSessionStore` | `src/stores/session.store.ts` | localStorage `maquina-session` | Sesion: userId, role, activeCampaign |

### Estado Local (EventMapDashboard)

| Estado | Tipo | Proposito |
|---|---|---|
| `mapSelection` | `MapHierarchySelection | null` | Seleccion geografica actual |
| `mapViewMode` | `"tracking" | "interview"` | Que puntos mostrar |
| `focusPoint` | `{lat, lng} | null` | Fly-to cuando usuario clickea |
| `highlightPoint` | `{lat, lng} | null` | Marcador pulse temporario (1.8s) |
| `timelineScope` | `"day" | "week"` | Scope del grafico timeline |

## 9. Sistema de Metas

Las metas se calculan dinamicamente por candidato y se ajustan segun la seleccion geografica:

| Candidato | Fuente de Meta | Niveles |
|---|---|---|
| Rocio | `votos_rocio.json` (80K total) | dep/prov/dist |
| Giovanna | `datos-giovanna.json` (subsector META) | dep/prov/dist/sector/subsector |
| Guillermo | Hardcoded (200K: 100K Lima + 100K Loreto) | Proporcional por provincia/distrito |
| Default | `objetive-sp.json` | dep |

## 10. Real-Time

**Estrategia dual:**

1. **SWR Polling** (fallback): Todos los hooks con intervalos de 5-15 segundos
2. **SSE/EventSource** (primario): Conecta a `NEXT_PUBLIC_WS_EVENTS_URL`
   - Eventos: `interviewer_tracking` (GPS) y `app_state_events` (foreground/background)
   - Calcula distancia entre posiciones consecutivas (Haversine)
   - Merge con datos iniciales de SWR

## 11. Control de Acceso

`DashboardAccessGate` valida:
1. Slug valido en `slugToCampaignId`
2. Campana existe
3. Dashboard "tierra" existe para esa campana
4. Status = `"ACTIVE"`
5. Sincroniza `activeCampaignId` en session store

## 12. Code Splitting

Componentes pesados con `next/dynamic` (SSR=false):
- `EventMapDashboard`, `PeruMapPanel`, `MaplibreMap`, `MapMarker`, `MapPopup`
- `InterviewerTimelineChart`, `ProgressChart`, `TimelineChart`, `PaceChart`

## 13. Schema DB: `territory`

| Columna | Tipo | Proposito |
|---|---|---|
| `id` | text PK | ID unico del registro |
| `interviewer` | text | Nombre del agente de campo |
| `candidate` | text | Nombre del candidato |
| `signature` | text | Firma unica dispositivo/sesion |
| `name` | text | Nombre del entrevistado |
| `phone` | text | Telefono del entrevistado |
| `address` | text | Direccion |
| `addressLocation` | jsonb | Lat/lng de direccion |
| `addressUtm` | jsonb | Coordenadas UTM |
| `location` | jsonb | Datos UTM raw |
| `createdAt` | timestamp | Fecha de registro |
| `latitude` | double | Latitud |
| `longitude` | double | Longitud |
| `east` | double | UTM este |
| `north` | double | UTM norte |
| `srid` | integer | SRID (default 4326) |

---

# Modulo INFO Giovanna

**Ruta:** `/info/giovanna`
**Archivo entrada:** `src/app/info/(protected)/giovanna/page.tsx`

## 1. Proposito

Dashboard de gestion de contactos para la operadora Giovanna Castagnino. Permite a las operadoras (Naomi, Dania, etc.) contactar ciudadanos via WhatsApp, marcar el estado de cada contacto (hablado/respondio), editar links de domicilio y local de votacion, y gestionar un flujo de trabajo de contacto telefonico.

## 2. Arbol de Componentes

```
InfoGiovannaPage (server component - page.tsx)
  InfoOperatorPage (server component - switch por config.type)
    InfoFeb8OperatorDashboard ("use client" - 1861 lineas)
      [HEADER]
        Image (logo GOBERNA)
        Badge (fecha)
        Titulo + subtitulo
        Contador de registros
        Indicador sincronizacion
      [CONTROLES]
        Input busqueda
        Botones filtro: No hablados | Hablados | Respondieron | Archivados | Todos
        Botones link: Ubicacion | Local
        Boton "Nuevo contacto"
      [MENSAJE WHATSAPP]
        Textarea expandible con template
      [TABLA]
        Table con columnas: Hora | Entrevistador | Ciudadano | Telefono (WhatsApp) | Estado
        Botones por fila: Casa | Local | Hablado | Respondio | Editar | Archivar
      [PAGINACION]
        PageSize: 20/50/100
        Navegacion: Primera | Anterior | Pagina X/Y | Siguiente | Ultima
      [MODALES]
        Dialog: Editar links (domicilio + local de votacion)
        Dialog: Crear nuevo contacto
```

## 3. Archivos Principales

| # | Archivo | Lineas | Rol |
|---|---|---|---|
| 1 | `src/app/info/(protected)/giovanna/page.tsx` | 7 | Entrada de ruta |
| 2 | `src/ui/reports/info/InfoOperatorPage.tsx` | 16 | Switch por tipo de config |
| 3 | `src/ui/reports/info/InfoFeb8OperatorDashboard.tsx` | 1861 | Dashboard completo (client) |
| 4 | `src/ui/reports/info/infoOperatorConfigs.ts` | 67 | Configuraciones de operadores |
| 5 | `src/app/api/info/8-febrero/giovanna/route.ts` | 119 | GET registros + DELETE |
| 6 | `src/app/api/info/8-febrero/giovanna/status/route.ts` | 61 | PATCH status/links |
| 7 | `src/app/api/info/8-febrero/actions/route.ts` | 236 | Audit log (GET analytics + POST) |
| 8 | `src/app/api/info/8-febrero/assign/route.ts` | 167 | Asignacion con locking |
| 9 | `src/app/api/info/8-febrero/stream/route.ts` | 200 | SSE real-time stream |
| 10 | `src/app/info/(protected)/layout.tsx` | 16 | Guard server-side |
| 11 | `src/info/auth.ts` | 45 | Autorizacion usuarios INFO |
| 12 | `src/db/connection-info.ts` | 11 | Conexion Neon (DATABASE_URL3) |
| 13 | `src/db/realtime-info.ts` | 96 | Infraestructura NOTIFY/LISTEN |

## 4. Configuracion Giovanna

```typescript
giovanna: {
  type: "feb8",
  operatorSlug: "giovanna",
  candidateName: "Giovanna Castagnino",
  title: "Registros Giovanna",
  subtitle: "Jornada de campo del 08 de febrero de 2026",
  badgeDate: "08 Feb 2026",
  tableTitle: "Tabla consolidada",
  tableDescription: "Registros cargados desde el CSV compartido.",
  apiBasePath: "/api/info/8-febrero/giovanna",
  allowedInterviewers: ["Contacto"],
  allowRecordsWithoutLinks: true,
}
```

| Propiedad | Efecto |
|---|---|
| `apiBasePath` | Usa API dedicada con tablas propias (no la general) |
| `allowedInterviewers: ["Contacto"]` | Solo muestra registros con `interviewer = "Contacto"` (+ nombre del user logueado) |
| `allowRecordsWithoutLinks: true` | Muestra todos los registros sin importar si tienen links |
| Sin `supervisor` | No filtra por supervisor en la API |
| Sin `excludeCandidates` | No excluye ningun candidato |

## 5. APIs y Flujo de Datos

### Arquitectura

```
Browser
  |-- SWR: GET /api/auth/me -> sesion
  |-- Fetch: GET /api/info/8-febrero/giovanna -> { records: 290, statuses: 130 }
  |     |-- DB: info_feb8_registros_giovanna (registros)
  |     |-- DB: info_feb8_status_giovanna (status, JOIN con registros para sourceId)
  |
  |-- PATCH /api/info/8-febrero/giovanna/status -> upsert contacted/replied/deleted + update links
  |-- POST /api/info/8-febrero/assign -> asignar/liberar registro (tabla compartida)
  |-- POST /api/info/8-febrero/actions -> log de auditoria
  |-- EventSource: GET /api/info/8-febrero/stream -> SSE real-time
```

### Endpoints

| Endpoint | Metodo | Proposito |
|---|---|---|
| `/api/info/8-febrero/giovanna` | GET | Obtiene registros + statuses (JOIN para sourceId) |
| `/api/info/8-febrero/giovanna` | DELETE | Archiva registro (soft delete via status) |
| `/api/info/8-febrero/giovanna/status` | PATCH | Actualiza contacted/replied + links |
| `/api/info/8-febrero/assign` | POST | Asigna/libera registro con locking optimista |
| `/api/info/8-febrero/actions` | POST | Registra accion de auditoria |
| `/api/info/8-febrero/actions` | GET | Analytics: conteos, tiempos, ultimas acciones |
| `/api/info/8-febrero/stream` | GET | SSE via PostgreSQL LISTEN/NOTIFY |

### Pipeline de Datos (Client-Side)

```
records (raw del API, 290 registros)
  -> filter: sourceId && phone presentes
  -> map: normalizar campos (timestamp, lat/lng como string, defaults)
  -> filter: timestamp && interviewer && phone no vacios
  -> filter: interviewer in allowedInterviewers (["Contacto"] + nombre del user)
  -> dedup: uniqueByPhone (Map, primer registro por telefono normalizado)
  -> recordsWithLinks (si allowRecordsWithoutLinks=true, todos pasan)
    -> accessibleRecords (admin ve todo; user solo ve no-asignados + sus asignados)
      -> filteredRecords (busqueda + filtro de status)
        -> linkFilteredRecords (filtro por tipo de link)
          -> pagedRecords (paginacion: slice por pageIndex * pageSize)
```

## 6. Base de Datos

### Tabla: `info_feb8_registros_giovanna`

| Columna | Tipo | Constraints |
|---|---|---|
| `source_id` | text | **PRIMARY KEY** |
| `interviewer` | text | nullable |
| `candidate` | text | nullable |
| `name` | text | nullable |
| `phone` | text | nullable |
| `signature` | text | nullable |
| `home_maps_url` | text | nullable |
| `polling_place_url` | text | nullable |
| `east` | double precision | nullable |
| `north` | double precision | nullable |
| `latitude` | double precision | nullable |
| `longitude` | double precision | nullable |
| `recorded_at` | timestamp with tz | nullable |
| `created_at` | timestamp with tz | default NOW |

### Tabla: `info_feb8_status_giovanna`

| Columna | Tipo | Constraints |
|---|---|---|
| `phone` | text | **PRIMARY KEY** |
| `contacted` | boolean | NOT NULL, default false |
| `replied` | boolean | NOT NULL, default false |
| `deleted` | boolean | NOT NULL, default false |
| `updated_at` | timestamp with tz | NOT NULL, default NOW |

### Tabla compartida: `info_feb8_action_events`

| Columna | Tipo | Constraints |
|---|---|---|
| `id` | text | **PRIMARY KEY** |
| `operator_slug` | text | NOT NULL, indexed |
| `action` | text | NOT NULL, indexed |
| `source_id` | text | nullable |
| `phone` | text | nullable |
| `person_name` | text | nullable |
| `actor_id` | text | NOT NULL |
| `actor_name` | text | NOT NULL |
| `actor_email` | text | NOT NULL |
| `created_at` | timestamp with tz | NOT NULL, default NOW, indexed |

### Datos Actuales (16 Feb 2026)

- **290 registros** en `info_feb8_registros_giovanna` (importados desde VCF)
- **130 status** en `info_feb8_status_giovanna` (130 contactados, 25 respondieron)
- Todos con `interviewer = "Contacto"`, `candidate = "Giovanna Castagnino"`

## 7. Auth y Seguridad

### Guard Server-Side

```
/info/(protected)/layout.tsx
  -> getSessionUser() (lee cookie maquina_session)
  -> Si no hay cookie: devuelve OPEN_ADMIN_USER (admin@info.gob)
  -> Si hay cookie: valida contra auth_sessions + auth_users
  -> isInfoUserEmail(email) -> debe ser @info.gob o estar en lista
  -> Falla: redirect a /info/login
```

### Usuarios Autorizados

| Email | Rol |
|---|---|
| admin@info.gob | Admin |
| naomi@info.gob | Operadora |
| dania@info.gob | Operadora |
| milagros@info.gob | Operadora |
| jazmin@info.gob | Operadora |
| reghina@info.gob | Operadora |

### Modelo de Permisos (Client-Side)

| Rol | Ve | Puede editar | Puede liberar | Bypass locks |
|---|---|---|---|---|
| **Admin** | Todos los registros | Todos | Todos | Si |
| **Operadora** | No-asignados + sus asignados | Solo los suyos | Solo los suyos | No |

## 8. Estado (100% Local)

No usa Zustand ni Context. Todo el estado vive en `useState` dentro de `InfoFeb8OperatorDashboard`.

| Estado | Tipo | Proposito |
|---|---|---|
| `records` | `InterviewRecord[]` | Lista master del API |
| `statusMap` | `Record<string, RecordStatus>` | Status por sourceId |
| `loading` | `boolean` | Carga inicial |
| `error` | `string | null` | Error de fetch |
| `search` | `string` | Busqueda free-text |
| `statusFilter` | `"uncontacted" | "contacted" | "replied" | "archived" | "all"` | Filtro activo |
| `linkFilter` | `"all" | "home" | "polling"` | Filtro por tipo de link |
| `pageSize` | `20 | 50 | 100` | Registros por pagina |
| `pageIndex` | `number` | Pagina actual |
| `message` | `string` | Template mensaje WhatsApp |
| `linksOpen` | `boolean` | Modal de edicion de links |
| `createOpen` | `boolean` | Modal de nuevo contacto |

### Updates Optimistas

Los cambios de status se aplican localmente de inmediato. Si la API falla, se hace rollback al estado anterior.

## 9. Interactividad

### Flujo de Contacto

```
1. Operadora ve lista de contactos pendientes
2. Click en telefono -> auto-asigna registro -> abre WhatsApp (wa.me)
3. Operadora marca "Hablado" (contacted = true)
4. Si el ciudadano responde, marca "Respondio" (replied = true)
5. Puede archivar si no es necesario (deleted = true, soft delete)
```

### Acciones Disponibles

| Accion | Trigger | Condiciones | API |
|---|---|---|---|
| **Abrir WhatsApp** | Click telefono | No bloqueado por otro user | Auto-assign + wa.me |
| **Marcar Hablado** | Boton "Hablado" | Debe ser dueno de asignacion | PATCH /status |
| **Marcar Respondio** | Boton "Respondio" | Debe estar contactado + ser dueno | PATCH /status |
| **Archivar** | Boton "Archivar" | Confirm dialog | PATCH /status (deleted=true) |
| **Editar Domicilio** | Icono casa | Debe ser dueno, no eliminado | Modal -> PATCH /status |
| **Editar Local** | Icono landmark | Debe ser dueno, no eliminado | Modal -> PATCH /status |
| **Editar Links** | Boton pencil | Debe ser dueno, no eliminado | Modal combinado |
| **Liberar** | Boton "Liberar" | Debe ser dueno (o admin) | POST /assign (release) |
| **Crear Contacto** | "Nuevo contacto" | User con nombre | POST /api/.../giovanna |
| **Buscar** | Input busqueda | Siempre | Client-side |
| **Filtrar por status** | Botones filtro | Siempre | Client-side |
| **Filtrar por links** | Ubicacion/Local | Siempre | Client-side |
| **Paginar** | Controles paginacion | Siempre | Client-side (20/50/100) |

### Acciones Auditadas

Cada accion se registra en `info_feb8_action_events`:
- `whatsapp`, `hablado`, `no_hablado`, `contestado`, `eliminado`
- `nuevo_contacto`, `domicilio_agregado`, `local_agregado`

## 10. Real-Time (SSE)

### Arquitectura

```
PostgreSQL LISTEN/NOTIFY (canal: "info_feb8_status")
     |
     v
GET /api/info/8-febrero/stream (SSE)
     |
     v
EventSource en browser
     |
     v
Actualiza statusMap y records en React state
```

### Eventos

| Evento | Contenido | Efecto en UI |
|---|---|---|
| `status` | contacted/replied/deleted | Actualiza iconos y contadores |
| `assignment` | assignedTo* fields | Actualiza permisos de edicion |
| `new_record` | Record completo | Agrega a la lista (dedup por sourceId+phone) |
| `ping` | keepalive (25s) | Mantiene conexion |
| `ready` | Debug info | Confirma conexion establecida |

### Infraestructura

- Pool WebSocket global via `@neondatabase/serverless` (singleton en `globalThis`)
- `pg_notify('info_feb8_status', payload)` para broadcasting
- Timeout de 1-1.5s para adquirir conexion del pool

## 11. Tipos Principales

```typescript
type InterviewRecord = {
  sourceId: string;
  interviewer: string;
  candidate: string;
  name: string;
  phone: string;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
  east?: string;
  north?: string;
  lat?: string;
  lng?: string;
  timestamp: string;
};

type RecordStatus = {
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedAt?: number | null;
  updatedAt?: number;
};

type InfoFeb8OperatorConfig = {
  type: "feb8";
  operatorSlug?: string;
  candidateName?: string;
  title: string;
  subtitle: string;
  badgeDate?: string;
  tableTitle: string;
  tableDescription: string;
  apiBasePath: string;
  supervisor?: string;
  excludeCandidates?: string[];
  allowedInterviewers?: string[];
  allowRecordsWithoutLinks?: boolean;
};

type InfoAction =
  | "no_hablado" | "hablado" | "contestado" | "eliminado"
  | "whatsapp" | "nuevo_contacto" | "domicilio_agregado" | "local_agregado";
```

---

## Comparativa Rapida

| Aspecto | Tierra | INFO Giovanna |
|---|---|---|
| **Proposito** | War room de campo (mapa + GPS) | Gestion de contactos telefonicos |
| **UI principal** | Mapa interactivo + sidebar | Tabla + filtros + modales |
| **Data source** | `territory` table | `info_feb8_registros_giovanna` |
| **Real-time** | SSE tracking + SWR polling | SSE status + SWR polling |
| **State** | Zustand + local state | 100% local state |
| **Auth** | DashboardAccessGate (campana) | Layout guard (@info.gob) |
| **Componente principal** | ~800 lineas (EventMapDashboardView) | ~1861 lineas (InfoFeb8OperatorDashboard) |
| **Dynamic imports** | MapLibre, Recharts | Ninguno |
| **DB connection** | `DATABASE_URL3` via `dbInfo` | `DATABASE_URL3` via `dbInfo` |
| **Neon project** | `winter-butterfly-76734031` | `winter-butterfly-76734031` |
