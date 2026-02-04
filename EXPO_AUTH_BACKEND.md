# Expo -> Backend Google Auth

Este backend expone `POST /auth/google` y valida el `idToken` de Google.

## Base URL

Definir en la app:

```bash
EXPO_PUBLIC_AUTH_BACKEND_URL=https://tu-dominio.com
```

## Request

```http
POST {EXPO_PUBLIC_AUTH_BACKEND_URL}/auth/google
Content-Type: application/json

{
  "idToken": "<google-id-token>"
}
```

## Response (200)

```json
{
  "ok": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "..."
  },
  "token": "<tu-token>"
}
```

## Session

- El backend crea una sesion interna y setea cookie httpOnly `maquina_session`.
- Para apps móviles, usar el `token` devuelto si necesitás guardarlo localmente.

## CORS

- Permitir el origin de la app web con `AUTH_ALLOWED_ORIGINS` (coma-separado).
- Si no se define `AUTH_ALLOWED_ORIGINS`, se permiten todos los origins.

## Notas de validacion

- Se valida firma, expiracion, issuer y audience (`GOOGLE_CLIENT_ID`).
- Si el email no existe en `auth_users`, se crea usuario con role `candidato`.

## Errores comunes

- `400 Missing idToken`: falta el campo `idToken`.
- `401 Invalid idToken`: token invalido o expirado.
- `401 Unverified email`: el email no esta verificado por Google.
- `500 Missing GOOGLE_CLIENT_ID`: falta la variable de entorno.
