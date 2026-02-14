# Migracion a VPS (Backend Only) con Fastify + Drizzle

## Contexto y pre-flight

- Se tomo `AGENTS.md` (raiz) y `src/app/AGENTS.md` como fuente de verdad.
- Objetivo: sacar el backend de Next API routes y moverlo a Fastify en VPS.
- Frontend mantiene consumo relativo a `/api`.

## Herramientas disponibles y limitaciones

- MCP utiles presentes:
  - Neon (proyectos, ramas, SQL, tuning, migraciones asistidas).
  - Vercel (deploy/logs/docs).
- MCP faltante para este caso:
  - No hay MCP dedicado para VPS/Nginx/systemd.
  - Esa parte se resuelve por shell/infra manual (o IaC externo).

## Arquitectura objetivo

Aplicar estrategia **strangler** (sin big-bang):

- `apps/backend` con Fastify + Drizzle + Zod.
- Next queda como UI solamente.
- Reverse proxy en VPS:
  - `/api/*` -> Fastify (`127.0.0.1:3001`)
  - `/*` -> Next (`127.0.0.1:3000`)
- Mantener cookie httpOnly de sesion (emitida por Fastify).
- Reusar capa de datos actual (`src/db/*`) o mover a `packages/data` para compartir schema/tipos.

## Plan de migracion (orden correcto)

1. **Congelar contratos**
   - Inventariar endpoints en `src/app/api/**/route.ts`.
   - Definir DTOs de request/response y codigos de error.

2. **Base de Fastify**
   - Bootstrap del server.
   - Plugins: `env`, `db`, `auth`, `rbac`, `request-id`, `error-handler`.

3. **Migrar endpoints criticos primero**
   - `/api/auth/*`
   - `/api/forms`
   - `/api/forms-map`
   - `/api/health`

4. **Proxy y smoke tests en VPS**
   - Configurar dominio con `/api` al backend.
   - Verificar login/logout, escritura de forms y health.

5. **Migracion por lotes del resto**
   - Portar rutas restantes en bloques chicos.
   - Eliminar API routes de Next recien al final.

## Riesgo principal detectado (y como evitar repetirlo)

### Schema drift

Ya ocurrio al forzar `DATABASE_URL3`: la app esperaba columnas que no existian en esa DB.

### Regla operativa

- Todo cambio en `src/db/schema.ts` debe tener migracion versionada.
- Todas las migraciones deben aplicarse en el target real (`DATABASE_URL3`) antes de cambiar trafico.
- Nunca cambiar de DB en runtime sin validar paridad de esquema.

## Estructura minima sugerida para backend

- `apps/backend/src/server.ts`
- `apps/backend/src/plugins/env.ts`
- `apps/backend/src/plugins/db.ts`
- `apps/backend/src/plugins/auth.ts`
- `apps/backend/src/modules/forms/routes.ts`
- `apps/backend/src/modules/forms/service.ts`
- `apps/backend/src/modules/forms/schema.ts`
- `apps/backend/src/modules/auth/routes.ts`
- `apps/backend/src/modules/auth/service.ts`
- `apps/backend/src/modules/auth/schema.ts`
- `apps/backend/src/shared/http/errors.ts`
- `apps/backend/src/shared/http/response.ts`

## Alcance de la siguiente iteracion (recomendado)

Scaffold inicial en `apps/backend` con:

1. Fastify funcionando.
2. Drizzle conectado a `DATABASE_URL3`.
3. Endpoints migrados: `/api/health`, `/api/auth/*`, `/api/forms`.
4. Ejemplo de `nginx` para `dominio/api`.
