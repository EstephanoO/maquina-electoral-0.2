# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Capa de datos para Neon + seeds locales.

## Responsabilidades
- Conexion Neon via Drizzle (server-side).
- Schema: territory, events, campaign_geojson, auth_users, auth_sessions,
  app_state_events, app_state_current.
- Seeds UI en `src/db/constants/*`.

## Notas
- Campaigns/events/forms/responses seed el flujo UI.
- Dashboard state vive en `src/modules/campaigns`.

## Limites
- Sin UI components.
- Sin logica de feature.

## Key files
- `src/db/schema.ts`
- `src/db/connection.ts`
- `src/db/constants/*`

## Skills
- .agents/skills/zustand-state-management/SKILL.md
