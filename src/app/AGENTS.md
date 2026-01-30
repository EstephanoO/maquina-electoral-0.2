# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Este modulo orquesta routing, layouts y API routes.

## Responsabilidades
- Layouts por ruta (console, dashboards, fullscreen, auth).
- Routing de dashboards candidato (`/dashboard/[client]/[template]`).
- Rutas de consola para admin/consultor (`/console/*`).
- API route handlers (`/api/*`).

## Limites
- No logica de dominio ni stores.
- No UI primitives ni componentes de bajo nivel.

## Notas de routing
- `/` es la entrada (session selector).
- `/console` y `/console/admin` deben estar role-gated.
- Los params dinamicos son async (Next 16) y se deben await.

## Auth y sesiones
- Auth con email/password en `/login`.
- API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Cookie httpOnly con sesion en `auth_sessions`.
- Guards server-side en layouts de `/console` y `/dashboard`.

## Rutas clave
- `src/app/(app)/dashboard/[client]/[template]/page.tsx`
- `src/app/(fullscreen)/eventos/[eventId]/dashboard/page.tsx`
- `src/app/console/events/[eventId]/page.tsx`
- `src/app/console/campaigns/[campaignId]/events/page.tsx`
- `src/app/api/auth/*`
- `src/app/api/events/route.ts`
- `src/app/api/interviews/route.ts`
- `src/app/api/geojson/route.ts`
- `src/app/api/territory-summary/route.ts`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
- .agents/skills/vercel-react-best-practices/SKILL.md
