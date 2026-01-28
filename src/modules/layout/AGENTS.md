# AGENTS.md

## Module overview
Owns the main app shell and top-of-screen candidate panel.

## Design system
- Source of truth: `design-system/MASTER.md`.

## Responsibilities
- App shell composition for candidate/estratega/consultor views.
- Candidate header panel with photo, metadata, and vote goal.
- Admin-only header behavior.
- Theme toggle UI.

## Boundaries
- No routing decisions beyond layout composition.
- No domain mutations; read-only props/state.

## Key files
- `src/modules/layout/ThemeToggle.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
