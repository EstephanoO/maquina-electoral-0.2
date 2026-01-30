# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Modulo de layout y shell principal.

## Design system
- Fuente de verdad: `design-system/MASTER.md`.

## Responsabilidades
- App shell para candidato/estratega/consultor.
- Candidate panel (foto, metadata, objetivo).
- Header/admin-only behavior.
- Theme toggle UI.

## Limites
- No routing (solo composicion de layout).
- Sin mutaciones de dominio; props/state read-only.

## Dependencias esperadas
- `src/theme/*` para ThemeProvider/ThemeScript.
- `src/modules/shared` para estados.

## Key files
- `src/modules/layout/ThemeToggle.tsx`
- `src/modules/layout/AppShell.tsx`
- `src/modules/layout/AppHeader.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
