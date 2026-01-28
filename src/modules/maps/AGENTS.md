# AGENTS.md

## Module overview
Map visual layer for MapLibre-based dashboards.

## Design system
- Source of truth: `design-system/MASTER.md`.

## Responsibilities
- MapPanel component, style wiring, marker rendering.
- Keep map styling consistent with app theme.
- Provide loading/error/empty overlays for map panels.
- PeruMapPanel provides Peru silhouette, fitBounds, and point tooltips.

## Performance
- MapLibre is lazy-loaded via `next/dynamic`.

## Boundaries
- No data fetching or event logic.
- Parent provides coordinates and any overlays.

## Key files
- `src/modules/maps/MapPanel.tsx`
- `src/modules/maps/PeruMapPanel.tsx`
- `src/maps/mapConfig.ts`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
