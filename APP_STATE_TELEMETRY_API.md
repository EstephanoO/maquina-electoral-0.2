# App State Telemetry API

Endpoint base: `/api/v1/telemetry/app-state`

## POST /api/v1/telemetry/app-state

Registra estado de actividad y conectividad de la app.

Headers:

- `Authorization: Bearer <token>` o
- `x-api-key: <key>`

Request body:

```json
{
  "eventId": "uuid",
  "timestamp": "2026-02-02T15:04:05.000Z",
  "session": {
    "interviewer": "string",
    "candidate": "string",
    "signature": "string"
  },
  "appState": "active",
  "connectivity": {
    "isConnected": true,
    "isInternetReachable": true,
    "connectionType": "wifi"
  },
  "device": {
    "os": "iOS",
    "osVersion": "17.3",
    "model": "iPhone15,3",
    "appVersion": "1.0.0"
  }
}
```

Fields:

- `eventId` (string, required): idempotencia del evento.
- `timestamp` (string, required): ISO-8601.
- `session.signature` (string, required).
- `appState` (string, required): `active | inactive | background`.
- `connectivity` (object, optional): estado de red en el momento del evento.
- `device` (object, optional): metadata del dispositivo.

Semantica:

- Enviar evento en cada cambio de AppState (active/inactive/background).
- Enviar evento en cold start (appState=active).
- Para apagar el telefono o cerrar la app, enviar `inactive`/`background` antes de terminar.

Responses:

- `202` accepted.
- `409` duplicate (idempotencia OK).
- `400/401/403` error cliente.

Ejemplo (inactive):

```json
{
  "eventId": "uuid",
  "timestamp": "2026-02-02T15:05:10.000Z",
  "session": {
    "interviewer": "Estephano",
    "candidate": "Giovanna Castagnino",
    "signature": "sig-test"
  },
  "appState": "inactive",
  "connectivity": {
    "isConnected": false,
    "isInternetReachable": false,
    "connectionType": "none"
  },
  "device": {
    "os": "Android",
    "osVersion": "14",
    "model": "Pixel 7",
    "appVersion": "1.0.0"
  }
}
```

## GET /api/v1/telemetry/app-state

Devuelve el ultimo estado por firma.

Query params:

- `signature` (repeatable) o `signatures` (csv).

Response:

```json
{
  "items": [
    {
      "signature": "string",
      "interviewer": "string",
      "candidate": "string",
      "lastState": "active",
      "lastSeenAt": "2026-02-02T15:04:05.000Z",
      "lastSeenActiveAt": "2026-02-02T15:04:05.000Z",
      "lastIsConnected": true,
      "lastIsInternetReachable": true,
      "lastConnectionType": "wifi",
      "deviceOs": "iOS",
      "deviceOsVersion": "17.3",
      "deviceModel": "iPhone15,3",
      "appVersion": "1.0.0",
      "updatedAt": "2026-02-02T15:04:05.000Z"
    }
  ]
}
```

## Expo (implementacion sugerida)

1. Escuchar AppState y NetInfo.
2. En cada cambio, generar eventId nuevo y enviar payload.
3. Enviar inactive/background al salir o perder foco.

Pseudocodigo:

```ts
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuidv4 } from "uuid";

const sendAppState = async (appState, net) => {
  const payload = {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    session: { interviewer, candidate, signature },
    appState,
    connectivity: {
      isConnected: net?.isConnected ?? false,
      isInternetReachable: net?.isInternetReachable ?? false,
      connectionType: net?.type ?? "unknown",
    },
    device: { os, osVersion, model, appVersion },
  };
  await fetch("/api/v1/telemetry/app-state", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": "<key>" },
    body: JSON.stringify(payload),
  });
};

let latestNetInfo = null;
NetInfo.addEventListener((state) => {
  latestNetInfo = state;
});

AppState.addEventListener("change", (nextState) => {
  sendAppState(nextState, latestNetInfo);
});

sendAppState("active", latestNetInfo);
```
