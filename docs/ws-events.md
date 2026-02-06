# WS Events Ingest — Integration Guide

Backend: Next.js App Router  
Endpoint: `/api/ws-events`  
Purpose: Persist WS events into Neon.

## Base URL

- Production: `https://dashboard.grupogoberna.com`

## Endpoint

- `POST /api/ws-events`

## Request Body (JSON)

```json
{
  "type": "interviewer_tracking" | "app_state_events",
  "payload": { "...": "..." }
}
```

`payload` can be a single object or an array (batch).

## Auth & Security

### API Key (optional)

- Header: `x-api-key: <key>`
- Only required if `API_PUBLIC_KEYS` is set in Next.js.

### Origin allowlist (optional)

- Controlled by `API_ALLOWED_ORIGINS`.
- If set, `Origin` must be in the allowlist.

### HMAC

- Not implemented.
- Current validation uses payload fields only.

## Payload Schemas

### `app_state_events`

Required:

- `signature` (string)
- `app_state` (`active` | `inactive` | `background`)
- `timestamp` (ISO string)

Optional:

- `interviewer`, `candidate`
- `is_connected`, `is_internet_reachable`
- `connection_type`, `device_os`, `device_os_version`, `device_model`, `app_version`

Example:

```json
{
  "type": "app_state_events",
  "payload": {
    "signature": "device-123",
    "app_state": "active",
    "timestamp": "2026-02-06T12:00:00Z"
  }
}
```

### `interviewer_tracking`

Required:

- `signature` (string)
- `interviewer` (string)
- `candidate` (string)
- `mode` (string)
- `tracked_at` (ISO string)
- `latitude` (number)
- `longitude` (number)

Optional:

- `event_id`, `interviewer_key`
- `accuracy`, `altitude`, `speed`, `heading`

Example:

```json
{
  "type": "interviewer_tracking",
  "payload": {
    "signature": "device-123",
    "interviewer": "juan",
    "candidate": "ana",
    "mode": "tracking",
    "tracked_at": "2026-02-06T12:00:00Z",
    "latitude": -12.0464,
    "longitude": -77.0428
  }
}
```

## Responses

- `200 OK` -> persisted successfully
- `400` -> invalid payload or missing required fields
- `401` -> missing/invalid API key
- `403` -> origin not allowed
- `500` -> persistence error

## Curl Examples

### app_state_events

```bash
curl -X POST "https://dashboard.grupogoberna.com/api/ws-events" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "type": "app_state_events",
    "payload": {
      "signature": "device-123",
      "app_state": "active",
      "timestamp": "2026-02-06T12:00:00Z"
    }
  }'
```

### interviewer_tracking

```bash
curl -X POST "https://dashboard.grupogoberna.com/api/ws-events" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "type": "interviewer_tracking",
    "payload": {
      "signature": "device-123",
      "interviewer": "juan",
      "candidate": "ana",
      "mode": "tracking",
      "tracked_at": "2026-02-06T12:00:00Z",
      "latitude": -12.0464,
      "longitude": -77.0428
    }
  }'
```

## Neon

- Project: `floral-mode-86437966` (Earth-data)
- Env var in Next.js: `DATABASE_URL` (Neon connection string)

## Notes

- `signature` is mandatory and is a payload field (not a header).
- If you want HMAC signing, it must be added server-side.
