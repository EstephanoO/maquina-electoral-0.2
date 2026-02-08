# Somos Peru unified dashboard

## Goal
Create a new party-level dashboard at `/dashboard/somos-peru/tierra` that preserves the existing Tierra layout and visual language while adding a candidate selector for an aggregated party view and per-candidate drill-down.

## Architecture
- Container: `src/dashboards/events/containers/PartyMapDashboard.tsx` handles data fetching, filtering, and calculations.
- UI: `src/ui/dashboards/events/EventMapDashboardView.tsx` remains the presentational layer.
- Utilities: `src/dashboards/events/utils/partyUtils.ts` handles goal parsing and candidate normalization.

## Components
- Header: candidate/party identity and KPI chips.
- Candidate selector: segmented control with `Todos`, `Rocio`, `Giovanna`, `Guillermo`.
- Main map: same map panel and controls as the Tierra dashboard.
- Right sidebar: KPIs, updates, top agents, status.
- Footer: progress-by-agent chart under the map.

## Data flow
- Fetch interviews: `/api/interviews` (no client filter).
- Fetch tracking: `/api/interviewer-tracking?includePrevious=1`.
- Filter rows in memory by candidate when selection is not `Todos`.
- Use filtered data for all KPIs, map points, rankings, and CSV export.

## Error and empty states
- Map-level loading/error/empty states are reused from the existing map system.
- KPIs fall back to zero when no data is available.

## Testing
- `/dashboard/somos-peru/tierra` loads map and sidebar.
- Selector changes filter results without route changes.
- `Todos` shows SOMOS PERU logo as the candidate image.
- CSV export respects the active filter.
