# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Modulo de UI para consola admin/consultor.

## Design system
- Fuente de verdad: `design-system/MASTER.md`.

## Responsabilidades
- Console shell, sidebar, topbar y access gate.
- Cards y resumenes de campaña para operaciones.

## Limites
- No decisiones de routing; `src/app` manda.
- No data fetching directo; usar stores o props.

## Dependencias esperadas
- `src/modules/shared` para estados Empty/Error/Loading.
- `src/stores/*` y `src/modules/campaigns` para estado UI (solo lectura).

## Key files
- `src/modules/console/*`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
