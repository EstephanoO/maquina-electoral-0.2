# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Primitivas UI para estados y acceso.

## Design system
- Fuente de verdad: `design-system/MASTER.md`.

## Responsabilidades
- RoleGate y UnauthorizedState.
- EmptyState / LoadingState / ErrorState.
- SessionHydrator (hidrata session desde `/api/auth/me`).

## Layout
- Estados compartidos render centrado y max-width.

## Limites
- Sin logica de feature; mantener generico.

## Key files
- `src/modules/shared/EmptyState.tsx`
- `src/modules/shared/LoadingState.tsx`
- `src/modules/shared/ErrorState.tsx`
- `src/modules/shared/RoleGate.tsx`
- `src/modules/shared/SessionHydrator.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
