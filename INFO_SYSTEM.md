# Info System (src/info)

This document summarizes the Info module behavior as used by the `src/info` surface and its related routes/UI.

## Auth

- Domain: `info.gob`
- Admin email: `admin@info.gob`
- Users are defined in `src/info/auth.ts`.
- Helpers:
  - `isInfoUserEmail(email)` accepts any `@info.gob` email, `admin@info.gob`, or a whitelisted user.
  - `isInfoAdminEmail(email)` checks only `admin@info.gob`.
  - `getInfoLoginEmail(input)` resolves username or email to a valid `@info.gob` login.

## Routes (Info)

- Protected layout: `src/app/info/(protected)/layout.tsx` gates by `isInfoUserEmail`.
- Pages:
  - `src/app/info/(protected)/guillermo/page.tsx`
  - `src/app/info/(protected)/giovanna/page.tsx`
  - `src/app/info/(protected)/rocio/page.tsx`
- Configs: `src/ui/reports/info/infoOperatorConfigs.ts`
  - `candidateName` used for new records.
  - `supervisor` used to filter records by `forms.candidate`.
  - `allowedInterviewers` restricts interviewers for specific operators.

## API

### `/api/info/8-febrero` (GET)

- Source of records is `forms`.
- Optional query params:
  - `supervisor` → filters `forms.candidate`.
  - `search` → search by name/phone/interviewer/etc.
- Returns:
  - `records` list (mapped from `forms`)
  - `statuses` list (merged from `info_feb8_status` plus latest action events)
- Admin detection: `user.role === "admin" || isInfoAdminEmail(user.email)`.

### `/api/info/8-febrero` (POST)

- Creates a new contact in `forms`.
- Required payload: `name`, `phone`, `candidate`.
- Defaults:
  - `fecha = now()`
  - `x = 0`, `y = 0`, `zona = "0"`
  - `encuestador = session user name`
  - `encuestadorId = session user id`
  - `candidatoPreferido = candidate`
- Optional: `homeMapsUrl`, `pollingPlaceUrl`, `comments`.

### `/api/info/8-febrero/status` (PATCH)

- Updates `info_feb8_status` for status changes.
- Updates `forms` for link/comment edits (`home_maps_url`, `polling_place_url`, `comentarios`).

### `/api/info/8-febrero/assign` (POST)

- Assigns records in `info_feb8_status` with operator data.
- Admin detection uses role or `admin@info.gob`.

### `/api/info/8-febrero/actions`

- Stores action events per operator in `info_feb8_action_events`.
- Used for stats and as fallback to build statuses when `info_feb8_status` is sparse.

### `/api/info/8-febrero/stream`

- SSE for realtime updates.
- Handles clean shutdown to avoid double-close errors.
- Admin detection uses role or `admin@info.gob`.

## UI Behaviors (Info)

- Main component: `src/ui/reports/info/InfoFeb8OperatorDashboard.tsx`.
- Filters:
  - Status: No hablados / Hablados / Respondieron / Archivados / Todos.
  - Link filters: Ubicacion (home) / Local (polling).
- Actions per filter:
  - No hablados: `Hablado`, `Archivar`.
  - Hablados: `Respondio`.
- Links indicator:
  - `Home` and `Landmark` icons show if links are present (green if active).
- Badge:
  - Assignment badge shows only first name (e.g., `naomi`).

## Data Model Notes (Info)

- `forms` holds the core dataset used by Info dashboards.
- `info_feb8_status` stores operational status (contacted/replied/deleted/assignment).
- `info_feb8_action_events` logs operator actions and feeds status fallback.
- `forms` now includes optional columns:
  - `home_maps_url`, `polling_place_url`, `comentarios`.

## Operator-specific Rules

- Guillermo:
  - Interviewers restricted to `agenda` + `VCF Import` (+ the current user if allowed list is non-empty).
  - Phone de-duplication in UI.
- Giovanna / Rocio:
  - Filtered by `forms.candidate = "Giovanna Castagnino" | "Rocio Porras"`.
