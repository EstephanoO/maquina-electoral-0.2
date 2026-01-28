# AGENTS.md

## Module overview
Data access layer for Neon-backed reads plus local UI seeds.

## Responsibilities
- Neon connection via Drizzle for `territory` reads/writes.
- Local storage keys and helpers.
- Client-side constants for UI seed data.

## Notes
- Campaigns/events/forms/responses seed the UI-only flow.
- Dashboard states live in `src/modules/campaigns` store.

## Key files
- `src/db/schema.ts`
- `src/db/connection.ts`
- `src/db/constants/*`

## Boundaries
- No UI components.
- No feature-specific logic.

## Skills
- .agents/skills/zustand-state-management/SKILL.md
