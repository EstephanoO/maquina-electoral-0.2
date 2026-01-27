# AGENTS.md

## Project overview
GOBERNA is the company behind MAQUINA-ELECTORAL, a political campaign management dashboard app. It serves five user roles:

- Consultores
- Clientes
- Admin
- Disenadores
- Entrevistadores

The app focuses on managing dashboards, data, and campaign operations (“war room”). For now, the scope is UI-only; data ingestion is documented as planned work.

### Key responsibilities by role
- **Admin**: manages consultants, tasks, permissions, and consultant-client assignments.
- **Consultores**: manage and update dashboard data for candidates.
- **Clientes**: view modern, elegant dashboards with campaign summaries, maps, timelines, and operational metrics.
- **Disenadores**: collaborate on creative assets and references used in campaign tasks.
- **Entrevistadores**: capture field responses for campaign events.

### Data sources (planned, not implemented yet)
- Excel uploads
- Specific data fields
- GeoJSON
- Google Sheets API

## UI layout strategy
- Admin/consultor use console shell; candidates use dashboard shell.
- Candidate panel sits at top with photo, metadata, and vote goal.
- Candidate navigation sidebar lists enabled dashboards.
- Tierra dashboards include MapLibre + right sidebar; other templates are card-based.

## Event flow
- Events can exist without dashboards (agenda-only).
- Tierra dashboards require a linked event and a form with required location.

## Modular architecture
The project is organized under `src/modules/*` by domain. Each module has its own `AGENTS.md` with responsibilities and boundaries.

### Current modules
- `modules/console`: admin/consultor console UI
- `modules/dashboards`: candidate dashboard UI + access gate
- `modules/layout`: app shell + candidate panel
- `modules/maps`: MapLibre panel
- `modules/shared`: empty/error/loading/access states
- `modules/campaigns`: campaign state + candidate profiles
- `modules/events`: agenda + form + response stores

## Build and test commands
- `npm run build`

## Code style guidelines
TBD. Keep modules isolated, prefer explicit interfaces, and avoid implicit cross-module dependencies.

## Testing instructions
TBD. No automated tests defined yet.

## Security considerations
- User roles are core to access control; UI should reflect permissions clearly.
- Data sources may contain sensitive campaign data; treat as confidential.
- Plan for audit trails when data editing is implemented.

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
- .agents/skills/vercel-react-best-practices/SKILL.md
- .agents/skills/zustand-state-management/SKILL.md
