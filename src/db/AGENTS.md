# AGENTS.md

## Module overview
Local data access layer for the UI-only phase.

## Responsibilities
- Local storage keys and helpers.
- Client-side constants for mock data sources.
- Shared data access primitives until real ingestion lands.

## Notes
- Campaigns/events/forms/responses seed the UI-only flow.
- Dashboard states live in `src/modules/campaigns` store.

## Boundaries
- No UI components.
- No feature-specific logic.

## Skills
- .agents/skills/zustand-state-management/SKILL.md
