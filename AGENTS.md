# AGENTS.md

## Contexto global
- MAQUINA-ELECTORAL (GOBERNA) es un dashboard de gestion de campanas politicas tipo war room.
- Roles clave: SUPER_ADMIN, CONSULTOR, CANDIDATO, ESTRATEGA, DISENADOR, ENTREVISTADOR.
- Stack: Next.js App Router (src/app), React 19, TypeScript strict, Tailwind 4.
- UI-first, pero con backend Neon/Drizzle activo para territory, events, geojson y auth.

## Arquitectura (mapa rapido)
- `src/app`: rutas, layouts y contenedores. Sin logica de negocio ni UI detallada.
- `src/<modulo>`: hooks, funcionalidades, utils, types, stores y servicios del modulo.
- `src/ui/<modulo>`: UI del modulo. `src/ui` es UI compartida.
- `src/ui/primitives`: primitives UI (shadcn/ui).
- `src/db`: schema, conexiones, queries y seeds/constants.
- `src/lib`: cross-cutting minimo (auth, RBAC, clientes HTTP). Si es de un modulo, va a su modulo.
- `src/theme`: ThemeProvider/ThemeScript y tokens.
- `src/stores`: solo estado app-level indispensable; preferir stores en cada modulo.
- `src/management`, `src/modules`, `src/components/ui`: legacy a migrar/eliminar, no expandir.

## Datos
- Neon: `territory`, `events`, `campaign_geojson`, `auth_users`, `auth_sessions`.
- Seeds UI: `src/db/constants/*` (campaigns, events, forms, responses, users, assets).
- Planificados: Excel, GeoJSON, Google Sheets.

## UI y layout
- Fuente de verdad: `design-system/MASTER.md`.
- Tipografia: Manrope (UI) + Fraunces (display).
- Consola para admin/consultor; dashboard para candidato.
- Tierra: MapLibre + sidebar; otros templates son card-based.

## Estado y fetching
- Zustand para stores y persistencia local.
- SWR para polling/dedup; evitar setInterval en UI.
- Cargas pesadas con `next/dynamic` (MapLibre, Recharts).

## Seguridad y roles
- RBAC en `src/lib/rbac.ts`.
- Sesion via cookie httpOnly; `SessionHydrator` consume `/api/auth/me`.
- Auth completo con email/password y tablas `auth_users`, `auth_sessions`.
- Login en `/login` con API `/api/auth/login` y logout en `/api/auth/logout`.
- Guards server-side en layouts de `/console` y `/dashboard`.

## Rutas clave
- Fullscreen tierra: `src/app/(fullscreen)/eventos/[eventId]/dashboard/page.tsx`.
- Consola eventos: `src/app/console/events/[eventId]/page.tsx`.
- Dashboards: `src/app/(app)/dashboard/[client]/[template]/page.tsx`.
- APIs: `src/app/api/auth/*`, `src/app/api/events/route.ts`,
  `src/app/api/interviews/route.ts`, `src/app/api/geojson/route.ts`,
  `src/app/api/territory-summary/route.ts`.

## Comandos
- `npm run build`
- `npm run lint`

## Reglas de modularidad
- Modulos aislados con interfaces explicitas y superficies publicas claras.
- No hay archivos “god”: evitar control centralizado. Composicion > acoplamiento.
- Evitar dependencias cruzadas implicitas entre modulos.
- Un modulo no importa internals de otro modulo. Solo consume su API publica.
- UI compartida en `src/ui`. Estados Empty/Error/Loading viven en `src/ui`.

## Consideraciones de seguridad
- Los datos son sensibles; evitar exponer payloads completos innecesarios.
- Auditar acciones cuando se implementen writes.

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
- .agents/skills/vercel-react-best-practices/SKILL.md
- .agents/skills/zustand-state-management/SKILL.md
