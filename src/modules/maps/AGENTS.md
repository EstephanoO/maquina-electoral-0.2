# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Capa visual de mapas para dashboards tierra.

## Design system
- Fuente de verdad: `design-system/MASTER.md`.

## Responsabilidades
- MapPanel y estilo base de MapLibre.
- Markers, tooltips y overlays de estado.
- PeruMapPanel: silhouette, fitBounds y tooltips.

## Performance
- MapLibre debe ser lazy-loaded con `next/dynamic`.

## Limites
- Sin data fetching ni logica de eventos.
- El parent provee coordenadas y overlays.

## Key files
- `src/modules/maps/MapPanel.tsx`
- `src/modules/maps/PeruMapPanel.tsx`
- `src/modules/maps/hierarchy/*`
- `src/maps/mapConfig.ts`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
