# Reporte: Integracion Cesar Vasquez - App Expo → Dashboard Tierra

**Fecha:** 16 Feb 2026
**Estado:** VERIFICADO EN PRODUCCION

---

## Resumen

Se creo el flujo completo para que la app movil Expo de Cesar Vasquez envie registros de campo y estos aparezcan en tiempo real en el dashboard de tierra.

```
App Expo → POST /api/cesar-vasquez/registros → Neon DB → Dashboard tierra (mapa)
```

---

## URL de la API

```
https://dashboard.grupogoberna.com/api/cesar-vasquez/registros
```

---

## Que se hizo

### 1. Tabla nueva en Neon

Proyecto: `winter-butterfly-76734031` (production branch)

**Tabla: `cesar_vasquez_registros`**

| Columna | Tipo | Requerido | Default |
|---------|------|-----------|---------|
| `id` | text PK | auto | UUID |
| `nombre_entrevistado` | text | SI | - |
| `telefono` | text | no | `""` |
| `zona` | text | no | `""` |
| `comentario` | text | no | `""` |
| `candidato` | text | no | `"Cesar Vasquez"` |
| `agente` | text | no | `""` |
| `ubicacion_utm` | jsonb | no | `null` |
| `latitude` | double | auto | derivado de UTM |
| `longitude` | double | auto | derivado de UTM |
| `fecha` | timestamptz | no | `now()` |
| `created_at` | timestamptz | auto | `now()` |

Indices: `fecha DESC`, `agente`.

### 2. API Route nueva

**Archivo:** `src/app/api/cesar-vasquez/registros/route.ts`

| Metodo | Que hace |
|--------|----------|
| `POST` | Recibe payload de la app Expo, convierte UTM→lat/lng, inserta en `cesar_vasquez_registros` + mirror en `territory` |
| `GET` | Lista todos los registros ordenados por fecha desc |
| `OPTIONS` | CORS preflight (mobile-friendly, `*`) |

### 3. Remocion de datos mock

Se eliminaron todos los datos simulados de Cesar Vasquez que cortocircuitaban las APIs:

| Archivo modificado | Que se quito |
|--------------------|-------------|
| `src/app/api/interviews/route.ts` | Import mock + early return con datos falsos |
| `src/app/api/interviewer-tracking/route.ts` | Import mock + early return con tracking falso |
| `src/app/api/interview-selection-count/route.ts` | Import mock + early return con conteos falsos |
| `src/app/api/interview-department-summary/route.ts` | Import mock + early return con resumen falso |
| `src/app/api/interview-districts/route.ts` | Import mock + early return con distritos falsos |
| `src/db/constants/cesar-vasquez-mock.ts` | ELIMINADO |

Se agrego `"cesar-vasquez": "Cesar Vasquez"` al mapa `clientToCandidate` en todas las rutas para que usen la DB real.

### 4. Schema Drizzle

**Archivo:** `src/db/schema.ts` — agregada tabla `cesarVasquezRegistros`.

### 5. Client mappings

**Archivo:** `src/lib/clientMappings.ts` — agregado `"cesar-vasquez": "cand-cesar-vasquez"`.

### 6. Documentacion

**Archivo:** `docs/API-CESAR-VASQUEZ.md` — documentacion completa para el equipo Expo.

---

## Flujo end-to-end

```
App Expo                          API (Next.js)                         Dashboard
  |                                  |                                     |
  |--- POST /cesar-vasquez/registros--->|                                  |
  |                                  |-- INSERT cesar_vasquez_registros    |
  |                                  |-- INSERT territory (mirror)         |
  |<--- { id: "abc123" } -----------|                                     |
  |                                  |                                     |
  |--- GET /cesar-vasquez/registros---->|                                  |
  |<--- [ registros ] --------------|  (tabla del dashboard movil)         |
  |                                  |                                     |
  |                                  |<-- GET /interviews?client=cesar-vasquez
  |                                  |--- SELECT territory --------------->|
  |                                  |                           Renderiza en mapa (8s poll)
```

### Por que el mirror a territory

La tabla `territory` es la que consume todo el stack existente del mapa:
- Puntos en MapLibre
- Drill-down departamento → provincia → distrito (PostGIS)
- Conteo por seleccion geografica
- Resumen por departamento
- Tracking de distritos con datos

Escribir en `territory` permite reusar todo sin tocar una sola linea del frontend.

---

## Verificacion en produccion

```bash
# POST - Crear registro
curl -X POST https://dashboard.grupogoberna.com/api/cesar-vasquez/registros \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_entrevistado": "Test Verificacion",
    "telefono": "999888777",
    "comentario": "Registro de prueba",
    "ubicacion_utm": {
      "zone": 18, "hemisphere": "S",
      "easting": 279854, "northing": 8661420,
      "datum_epsg": 32718
    },
    "candidato": "Cesar Vasquez",
    "agente": "Cesar Vasquez",
    "fecha": "2026-02-16T20:00:00.000Z"
  }'
# → 201 { "id": "d2029944-..." }

# GET - Listar registros (app Expo)
curl https://dashboard.grupogoberna.com/api/cesar-vasquez/registros
# → 200 [ { registro con lat/lng derivados de UTM } ]

# GET - Dashboard tierra (mapa web)
curl "https://dashboard.grupogoberna.com/api/interviews?client=cesar-vasquez"
# → 200 { "points": [ { punto visible en el mapa } ] }
```

| Test | Status | Resultado |
|------|--------|-----------|
| POST registro | 201 | ID devuelto correctamente |
| GET registros (app) | 200 | Registro con lat/lng derivados de UTM |
| GET interviews (mapa) | 200 | Mirror en territory funciona |
| Conversion UTM→LatLng | OK | `-12.101389, -77.022676` (Lima) |
| Registro de prueba | LIMPIADO | Eliminado de ambas tablas |

---

## Para el equipo Expo

En `lib/cesar-vasquez-api.ts`:

```typescript
const API_BASE_URL = 'https://dashboard.grupogoberna.com/api/cesar-vasquez';
```

Documentacion detallada en `docs/API-CESAR-VASQUEZ.md`.

---

## Archivos tocados

| Archivo | Accion |
|---------|--------|
| `src/db/schema.ts` | Agregada tabla `cesarVasquezRegistros` |
| `src/app/api/cesar-vasquez/registros/route.ts` | NUEVO - API para la app Expo |
| `src/app/api/interviews/route.ts` | Quitado mock, agregado cesar-vasquez a clientToCandidate |
| `src/app/api/interviewer-tracking/route.ts` | Quitado mock, agregado cesar-vasquez a clientToCandidate |
| `src/app/api/interview-selection-count/route.ts` | Quitado mock, agregado cesar-vasquez a clientToCandidate |
| `src/app/api/interview-department-summary/route.ts` | Quitado mock, agregado cesar-vasquez a clientToCandidate |
| `src/app/api/interview-districts/route.ts` | Quitado mock, agregado cesar-vasquez a clientToCandidate |
| `src/lib/clientMappings.ts` | Agregado cesar-vasquez → cand-cesar-vasquez |
| `src/db/constants/cesar-vasquez-mock.ts` | ELIMINADO |
| `docs/API-CESAR-VASQUEZ.md` | NUEVO - Documentacion para equipo Expo |
