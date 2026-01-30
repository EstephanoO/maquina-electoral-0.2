# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Estado de dominio para campañas y perfiles.

## Responsabilidades
- Store de campañas, estados de dashboard y metadata de candidatos.
- Dashboards ACTIVE/DRAFT con event links opcionales.
- Acciones para update de status/perfiles.

## Persistencia
- Estado local con `localStorage` y schema versionado + migrate.

## Limites
- Sin UI rendering.
- Persistir solo estado de UI.

## Key files
- `src/modules/campaigns/store.ts`

## Skills
- .agents/skills/zustand-state-management/SKILL.md
