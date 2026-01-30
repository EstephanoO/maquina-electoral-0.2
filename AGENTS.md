# AGENTS.md

## Contexto global
- MAQUINA-ELECTORAL (GOBERNA) es un dashboard de gestion de campanas politicas tipo war room.
- Roles clave: SUPER_ADMIN, CONSULTOR, CANDIDATO, ESTRATEGA, DISENADOR, ENTREVISTADOR.
- Stack: Next.js App Router (src/app), React 19, TypeScript strict, Tailwind 4.
- UI-first, pero con backend Neon/Drizzle activo para territory, events, geojson y auth.

## Arquitectura (mapa rapido)
- `src/app`: rutas, layouts, loaders y API route handlers.
- `src/modules/*`: UI por dominio (console, dashboards, layout, maps, shared, campaigns, events).
- `src/stores`: estado global (session, assets, app).
- `src/db`: schema, connection Neon, seeds/constants.
- `src/lib`: tipos, auth, RBAC y helpers compartidos.
- `src/theme`: ThemeProvider/ThemeScript y tokens.
- `src/components/ui`: primitives shadcn/ui.
- `src/ui`, `src/management`, `src/dashboards`, `src/maps`: legacy, no expandir.

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
- Modulos aislados con interfaces explicitas.
- Evitar dependencias cruzadas implicitas entre modulos.
- Estados Empty/Error/Loading deben usar `src/modules/shared`.

## Consideraciones de seguridad
- Los datos son sensibles; evitar exponer payloads completos innecesarios.
- Auditar acciones cuando se implementen writes.

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
- .agents/skills/vercel-react-best-practices/SKILL.md
- .agents/skills/zustand-state-management/SKILL.md
