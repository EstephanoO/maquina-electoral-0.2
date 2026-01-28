# AGENTS.md

## Module overview
Reusable UI primitives for state and access control.

## Design system
- Source of truth: `design-system/MASTER.md`.

## Responsibilities
- RoleGate and UnauthorizedState.
- EmptyState / LoadingState / ErrorState.

## Layout
- Shared states render centered with max-width.

## Boundaries
- No feature logic; keep generic.

## Key files
- `src/modules/shared/EmptyState.tsx`
- `src/modules/shared/LoadingState.tsx`
- `src/modules/shared/ErrorState.tsx`
- `src/modules/shared/RoleGate.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
