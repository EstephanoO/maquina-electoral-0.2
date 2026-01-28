# AGENTS.md

## Module overview
Campaign domain state and profile metadata for candidates.

## Responsibilities
- Store campaign list, dashboard status, and candidate metadata.
- Dashboards can be ACTIVE or DRAFT and optionally linked to events.
- Expose actions to update status and profiles.

## Persistence
- Local state only; `localStorage` persistence uses versioned schema with migrate.

## Boundaries
- No UI rendering.
- Persist only UI state (localStorage).

## Key files
- `src/modules/campaigns/store.ts`

## Skills
- .agents/skills/zustand-state-management/SKILL.md
