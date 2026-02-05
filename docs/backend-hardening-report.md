# GOBERNA - Endurecimiento interno sin romper Expo

Fecha: 2026-02-05

## Objetivo
Mejorar estabilidad, trazabilidad e idempotencia del backend sin cambiar la app Expo ni los payloads actuales.

## Fase 1 - Observabilidad y validaciones

Cambios
- Logs estructurados con `requestId`, ruta, status, duracion y errores.
- Header `x-request-id` en respuestas.
- Validaciones con errores consistentes en las rutas base.

Archivos
- `src/lib/api/http.ts`
- `src/app/api/forms/route.ts`
- `src/app/api/interviewer_tracking/route.ts`
- `src/app/api/app_state_events/route.ts`
- `src/app/api/health/route.ts`

## Fase 2 - Idempotencia

Cambios
- Id estable para retries cuando el cliente no envia `id` (hash de payload).
- Upsert sigue igual si el cliente envia `id`.

Archivos
- `src/lib/api/idempotency.ts`
- `src/app/api/interviewer_tracking/route.ts`
- `src/app/api/app_state_events/route.ts`

## Fase 3 - Seguridad gradual

Cambios
- Allowlist opcional por origen para endpoints publicos.
- API key opcional con multiple claves, sin romper clientes existentes.
- Respuestas 401/403 solo si se activan env vars.

Env vars (opcionales)
- `API_ALLOWED_ORIGINS` (CSV de origins permitidos)
- `API_PUBLIC_KEYS` (CSV de api keys permitidas)

Archivos
- `src/lib/api/auth.ts`
- `src/app/api/forms/route.ts`
- `src/app/api/interviewer_tracking/route.ts`
- `src/app/api/app_state_events/route.ts`

## Consideraciones

- Las rutas y payloads de Expo no cambian.
- Al activar `API_PUBLIC_KEYS`, la app debe enviar `x-api-key`.
- Al activar `API_ALLOWED_ORIGINS`, requests sin `Origin` siguen permitidas (compatibilidad server-side).
- Para seguridad real, activar primero en entorno de prueba.
