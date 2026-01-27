# AGENTS.md

## Module overview
Campaign domain state and profile metadata for candidates.

## Responsibilities
- Store campaign list, dashboard status, and candidate metadata.
- Dashboards can be ACTIVE or DRAFT and optionally linked to events.
- Expose actions to update status and profiles.

## Boundaries
- No UI rendering.
- Persist only UI state (localStorage).

## Skills
- .agents/skills/zustand-state-management/SKILL.md
