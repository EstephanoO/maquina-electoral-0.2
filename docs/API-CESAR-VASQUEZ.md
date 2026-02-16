# API Cesar Vasquez - Registros de Campo

## Base URL

```
https://goberna.vercel.app/api/cesar-vasquez/registros
```

> Reemplazar `goberna.vercel.app` con el dominio correcto de produccion si difiere.

---

## Endpoints

### POST /api/cesar-vasquez/registros

Crea un nuevo registro de campo desde la app movil.

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "nombre_entrevistado": "Juan Perez Garcia",
  "telefono": "987654321",
  "comentario": "Persona interesada en apoyar la campana",
  "ubicacion_utm": {
    "zone": 18,
    "hemisphere": "S",
    "easting": 279854,
    "northing": 8661420,
    "datum_epsg": 32718
  },
  "candidato": "Cesar Vasquez",
  "agente": "Cesar Vasquez",
  "fecha": "2026-02-16T14:30:00.000Z"
}
```

**Campos:**

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `nombre_entrevistado` | string | SI | - | Nombre completo del entrevistado |
| `telefono` | string | no | `""` | Telefono de contacto (9 digitos) |
| `comentario` | string | no | `""` | Comentario/observacion del agente |
| `ubicacion_utm` | object/null | no | `null` | Coordenadas UTM del GPS del dispositivo |
| `ubicacion_utm.zone` | number | si (si utm) | - | Zona UTM (18 para Peru) |
| `ubicacion_utm.hemisphere` | "N"/"S" | si (si utm) | - | Hemisferio (siempre "S" para Peru) |
| `ubicacion_utm.easting` | number | si (si utm) | - | Coordenada Este |
| `ubicacion_utm.northing` | number | si (si utm) | - | Coordenada Norte |
| `ubicacion_utm.datum_epsg` | number | si (si utm) | - | EPSG del datum (32718 para Peru zona 18S) |
| `candidato` | string | no | `"Cesar Vasquez"` | Nombre del candidato |
| `agente` | string | no | `""` | Nombre del agente que registra |
| `fecha` | string (ISO 8601) | no | `now()` | Fecha/hora del registro |

**Respuesta exitosa (201):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Errores posibles:**

| Status | Body | Causa |
|--------|------|-------|
| 400 | `{ "error": "nombre_entrevistado es requerido" }` | Falta el campo obligatorio |
| 500 | `{ "error": "Error interno del servidor" }` | Error de base de datos |

---

### GET /api/cesar-vasquez/registros

Lista todos los registros de Cesar Vasquez ordenados por fecha (mas recientes primero).

**Headers:** Ninguno requerido.

**Respuesta exitosa (200):**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nombre_entrevistado": "Juan Perez Garcia",
    "telefono": "987654321",
    "comentario": "Persona interesada en apoyar la campana",
    "ubicacion_utm": {
      "zone": 18,
      "hemisphere": "S",
      "easting": 279854,
      "northing": 8661420,
      "datum_epsg": 32718
    },
    "candidato": "Cesar Vasquez",
    "agente": "Cesar Vasquez",
    "latitude": -12.108921,
    "longitude": -77.049845,
    "fecha": "2026-02-16T14:30:00.000Z"
  }
]
```

**Nota:** `latitude` y `longitude` son derivados automaticamente de `ubicacion_utm` al momento del POST. Si `ubicacion_utm` fue null, ambos seran null.

---

## Flujo completo

```
App Expo                          API (Next.js)                    Dashboard
  |                                  |                                |
  |--- POST /cesar-vasquez/registros--->|                             |
  |                                  |-- INSERT cesar_vasquez_registros
  |                                  |-- INSERT territory (mirror)    |
  |<--- { id: "abc123" } -----------|                                |
  |                                  |                                |
  |--- GET /cesar-vasquez/registros---->|                             |
  |<--- [ { registros... } ] -------|                                |
  |                                  |                                |
  |                                  |<-- GET /interviews?client=cesar-vasquez
  |                                  |--- SELECT FROM territory ----->|
  |                                  |                           Renderiza en mapa
```

### Que pasa internamente

1. El POST guarda en la tabla `cesar_vasquez_registros` (datos con nombres en espanol).
2. Tambien hace mirror a la tabla `territory` (formato interno del dashboard de tierra).
3. Si se envia `ubicacion_utm`, la API convierte automaticamente UTM a lat/lng (WGS-84).
4. La app Expo consulta `GET /api/cesar-vasquez/registros` para llenar la tabla del dashboard movil.
5. El dashboard web consulta `GET /api/interviews?client=cesar-vasquez` cada 8 segundos (SWR polling).
6. Los puntos con coordenadas aparecen en el mapa MapLibre.

---

## CORS

La API acepta requests desde cualquier origen (mobile-friendly):

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, x-api-key`

---

## Tipo TypeScript (para la app Expo)

```typescript
type FormPayload = {
  nombre_entrevistado: string;
  telefono?: string;
  comentario?: string;
  ubicacion_utm?: {
    zone: number;
    hemisphere: 'N' | 'S';
    easting: number;
    northing: number;
    datum_epsg: number;
  } | null;
  candidato?: string;   // siempre "Cesar Vasquez"
  agente?: string;      // siempre "Cesar Vasquez"
  fecha?: string;       // ISO 8601
};

type PostResponse = {
  id: string;
};
```

---

## Ejemplo con fetch (React Native / Expo)

```typescript
const API_BASE_URL = 'https://goberna.vercel.app/api/cesar-vasquez';

// Crear registro
const response = await fetch(`${API_BASE_URL}/registros`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre_entrevistado: 'Juan Perez',
    telefono: '987654321',
    comentario: 'Persona interesada en apoyar la campana',
    ubicacion_utm: {
      zone: 18,
      hemisphere: 'S',
      easting: 279854,
      northing: 8661420,
      datum_epsg: 32718,
    },
    candidato: 'Cesar Vasquez',
    agente: 'Cesar Vasquez',
    fecha: new Date().toISOString(),
  }),
});

const { id } = await response.json();

// Listar registros
const listResponse = await fetch(`${API_BASE_URL}/registros`);
const registros = await listResponse.json();
```

---

## Campos del formulario en la app

| Campo | Tipo UI | Requerido |
|-------|---------|-----------|
| Nombre del entrevistado | texto | Si |
| Telefono | numerico, 9 digitos | Si |
| Comentario | texto multilinea | No |
| Ubicacion GPS | boton captura → UTM | No |

Datos fijos (no editables por el agente): `candidato`, `agente`, `fecha`.

---

## Configuracion en la app Expo

En `lib/cesar-vasquez-api.ts`, cambiar:

```typescript
// ANTES:
const API_BASE_URL = '__PENDIENTE_URL_API__';

// DESPUES:
const API_BASE_URL = 'https://goberna.vercel.app/api/cesar-vasquez';
```
