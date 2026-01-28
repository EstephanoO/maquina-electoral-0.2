# AGENTS.md

## Module overview
Dashboard UI building blocks and access gates for candidate-facing dashboards.

## Design system
- Source of truth: `design-system/MASTER.md`.

## Responsibilities
- Candidate dashboard fragments (KPI grid, summary, timeline).
- Dashboard navigation sidebar and access gating.
- Tierra sidebar and map-ready layout fragments.
- Event overview dashboard blocks for tierra campaigns.
- EventMapDashboard is the reusable tierra event layout.

## Data fetching
- Use SWR for polling and deduplication in client components.
- Charts are lazy-loaded via `next/dynamic`.

## Notes
- Draft dashboards are hidden from candidates until activated.

## Boundaries
- No domain writes. Reads are allowed via stores for gating only.
- No routing; use in app routes.

## Key files
- `src/modules/dashboards/events/EventMapDashboard.tsx`
- `src/modules/dashboards/events/EventRecordsDialog.tsx`
- `src/modules/dashboards/MapSection.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
