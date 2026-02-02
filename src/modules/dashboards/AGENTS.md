# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Modulo de UI para dashboards candidato y gating.

## Design system
- Fuente de verdad: `design-system/MASTER.md`.

## Responsabilidades
- Fragments de dashboard (KPI grid, summary, timeline).
- Sidebar de navegacion y acceso por rol.
- Tierra sidebar y layout map-ready.
- EventMapDashboard como layout reutilizable de eventos tierra.
- EventMapDashboard acepta nota de contexto opcional (contextNote).

## Data fetching y performance
- Usar SWR para polling y dedup en client components.
- Cargas pesadas (Recharts) deben ser lazy via `next/dynamic`.
- `EventMapDashboard` se carga via `next/dynamic` en consola y tierra.

## Notas
- Dashboards DRAFT no visibles para candidatos.
- Estado de entrevistadores usa telemetria app-state + tracking:
  verde conectado activo, naranja activo sin movimiento, plomo inactivo.
- Presencia activa: ventana de 15 segundos.
- Movimiento: naranja si el ultimo tramo <= 10m.

## Limites
- Sin writes de dominio. Lecturas solo para gating.
- Sin routing; se usa desde `src/app`.

## Key files
- `src/modules/dashboards/events/EventMapDashboard.tsx`
- `src/modules/dashboards/events/EventRecordsDialog.tsx`
- `src/modules/dashboards/MapSection.tsx`

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
