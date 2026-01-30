# Informe de issues (best practices)

## Alcance
- Reglas base: `vercel-react-best-practices` + arquitectura definida en `AGENTS.md`.
- Repositorio completo con foco en `src/app`, `src/modules`, `src/db`, `src/lib`, `src/stores`.

## Resumen ejecutivo
- Criticos: bundle size y seguridad en API.
- Altos: mismatch de roles/auth, boundaries difusos (stores/legacy), config Next incompleta.
- Medios: duplicacion de mappings, fetch client sin SWR dedup, naming collisions.
- Bajos: README desactualizado, sin tests automatizados.

## Criticos
### 1) Bundle size (Recharts + Lucide + JSON condicional)
- `recharts` import directo en client components:
  - `src/modules/dashboards/events/EventMapDashboard.tsx`
  - `src/modules/dashboards/EventTierraCharts.tsx`
  - `src/modules/dashboards/guillermo/dashboard/CampaignsPie.tsx`
  - `src/modules/dashboards/guillermo/dashboard/DashboardMain.tsx`
  - `src/modules/dashboards/guillermo/dashboard/DashboardSidebar.tsx`
  - `src/modules/dashboards/guillermo/dashboard/GuillermoMap.tsx`
  Impacto: bundle inflado en todos los dashboards.
  Fix: mover charts a componentes lazy con `next/dynamic` (`ssr: false`).

- `lucide-react` via barrel import:
  - `src/app/console/campaigns/page.tsx`
  - `src/modules/console/ConsoleSidebar.tsx`
  - `src/modules/layout/CandidatePanel.tsx`
  - `src/modules/dashboards/events/EventRecordsDialog.tsx`
  - `src/components/ui/*.tsx`
  Impacto: icon bundle innecesario.
  Fix: imports directos por icono o `experimental.optimizePackageImports` en `next.config.ts`.

- JSON grande cargado siempre:
  - `src/modules/dashboards/events/EventMapDashboard.tsx` (`datos-giovanna.json`)
  Impacto: payload innecesario para clientes no-giovanna.
  Fix: `import()` condicional o mover a API.

### 2) Seguridad en API (sin auth/role checks)
- Handlers con POST/PATCH/DELETE abiertos:
  - `src/app/api/events/route.ts`
  - `src/app/api/interviews/route.ts`
  - `src/app/api/geojson/route.ts`
  - `src/app/api/auth/login/route.ts` (ok), `logout` (ok), `me` (ok)
  Impacto: cualquiera puede mutar datos si conoce endpoints.
  Fix: validar sesion con `getSessionUser`, chequear roles via `rbac` y bloquear writes no autorizados.

## Altos
### 3) Mismatch de roles entre auth y RBAC
- Auth solo usa `admin` y `candidato` (`src/lib/auth/types.ts`).
- RBAC define SUPER_ADMIN/CONSULTOR/CANDIDATO/ESTRATEGA/DISENADOR/ENTREVISTADOR (`src/lib/rbac.ts`).
- Session store mapea `admin` => SUPER_ADMIN (`src/stores/session.store.ts`).
  Impacto: roles de negocio no existen en auth real.
  Fix: unificar modelo de roles y origen de verdad.

### 4) Boundaries difusos (stores globales y legacy)
- Stores fuera de modulos (`src/stores/*`) consumen seeds de `src/db/constants`.
- Legacy vivo: `src/ui`, `src/management`, `src/dashboards`, `src/maps`.
  Impacto: dificulta ownership y rompe modularidad.
  Fix: definir ownership de stores o mover a `src/modules/*`. Mantener legacy en modo solo mantenimiento.

### 5) Config Next vacia
- `next.config.ts` sin optimizaciones.
  Impacto: no se aprovecha `optimizePackageImports` ni otras mejoras.
  Fix: activar optimizaciones de bundle (lucide) y revisar config.

## Medios
### 6) Fetch client sin dedup en algunos features
- `src/modules/dashboards/guillermo/dashboard/CampaignsPie.tsx`
- `src/modules/dashboards/guillermo/hooks/useDailySeries.ts`
- `src/modules/dashboards/guillermo/hooks/usePanoramaData.ts`
  Impacto: refetch redundante en montajes.
  Fix: SWR con fetcher compartido y dedup.

### 7) Duplicacion de client mapping
- `clientToCandidate` existe en:
  - `src/app/api/interviews/route.ts`
  - `src/app/api/territory-summary/route.ts`
- `resolveCampaignIdFromClient` vive en `src/lib/clientMappings.ts`.
  Impacto: mappings divergen con el tiempo.
  Fix: unificar en un helper.

### 8) Naming collisions
- `MapSection` existe en `src/modules/dashboards/MapSection.tsx` y `src/modules/dashboards/events/components/MapSection.tsx`.
  Impacto: ambiguedad en imports.
  Fix: renombrar uno o moverlo a un namespace.

## Bajos
### 9) README desactualizado
- `README.md` sigue el template de create-next-app y menciona Geist.
  Fix: documentar arquitectura real, roles, comandos y flujo de datos.

### 10) Sin tests automatizados
- No hay setup de tests ni scripts.
  Fix: definir baseline (unit o e2e) o dejar explicitamente fuera de scope.

## Orden recomendado de correccion
1) Seguridad en API (auth + RBAC en write routes).
2) Bundle size (Recharts lazy + lucide optimize + JSON condicional).
3) Unificar modelo de roles.
4) Alinear boundaries y ownership de stores/legacy.
5) SWR dedup + helper unico de mappings.
6) Limpieza de naming + README + tests.
