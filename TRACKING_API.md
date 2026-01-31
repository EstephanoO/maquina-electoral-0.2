# Interviewer Tracking API

Endpoint base: `/api/interviewer-tracking`

## POST /api/interviewer-tracking
Receives interviewer tracking points from the Expo APK.

Query params:
- `eventId` (optional): event ID for the tierra dashboard.

Request body:
```json
{
  "interviewer": "Juan Perez",
  "candidate": "Candidato X",
  "signature": "device|ios|17.2|2021-class",
  "timestamp": "2026-01-30T12:34:56.789Z",
  "mode": "moving",
  "coords": {
    "latitude": -34.603722,
    "longitude": -58.381592,
    "accuracy": 12.5,
    "altitude": 25.4,
    "speed": 1.2,
    "heading": 180
  }
}
```

Notes:
- `interviewer_key` is derived as `"${interviewer} | ${signature}"`.
- Backend still accepts `coords["la titude"]` for backward compatibility but will log a warning.

Response:
```json
{ "ok": true }
```

## GET /api/interviewer-tracking
Returns the latest point per interviewer (distinct by interviewer_key).

Query params:
- `eventId` (optional)
- `candidate` (optional)
- `client` (optional): one of `rocio`, `giovanna`, `guillermo`
- `mode` (optional): filter by mode, e.g. `moving`

Response:
```json
{
  "points": [
    {
      "id": "...",
      "eventId": "...",
      "interviewer": "Juan Perez",
      "candidate": "Candidato X",
      "signature": "device|ios|17.2|2021-class",
      "interviewerKey": "Juan Perez | device|ios|17.2|2021-class",
      "mode": "moving",
      "trackedAt": "2026-01-30T12:34:56.789Z",
      "latitude": -34.603722,
      "longitude": -58.381592,
      "accuracy": 12.5,
      "altitude": 25.4,
      "speed": 1.2,
      "heading": 180
    }
  ]
}
```
