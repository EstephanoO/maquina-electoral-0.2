# AGENTS.md

## Module overview
Next.js app routes, layouts, and navigation flow.

## Responsibilities
- Route-level layouts for console and dashboards.
- Candidate dashboard routing (`/dashboard/[client]/[template]`).
- Console routes for admin/consultor (`/console/*`).

## Non-responsibilities
- No domain logic or store definitions.
- No low-level UI components.

## Routing notes
- `/` is the session selector entry.
- `/console` and `/console/admin` are role-gated.
- Dynamic route params are async (Next 16) and must be awaited.

## Skills
- .agents/skills/frontend-design/SKILL.md
- .agents/skills/ui-ux-pro-max/SKILL.md
- .agents/skills/shadcn-ui/SKILL.md
- .agents/skills/vercel-react-best-practices/SKILL.md
