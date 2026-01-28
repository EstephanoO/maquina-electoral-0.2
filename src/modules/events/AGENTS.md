# AGENTS.md

## Module overview
Event domain state: agenda, forms, and response points.

## Responsibilities
- Event store (agenda board). Events may or may not link to dashboards.
- Form schema store and response store (location required for Tierra).

## Boundaries
- No UI rendering.
- No UI rendering. Store layer only.

## Key files
- `src/modules/events/events.store.ts`
- `src/modules/events/forms.store.ts`
- `src/modules/events/responses.store.ts`

## Skills
- .agents/skills/zustand-state-management/SKILL.md
