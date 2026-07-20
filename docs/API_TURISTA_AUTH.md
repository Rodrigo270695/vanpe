# API autenticación turista (`/api/v1/tourist`)

Identidad: modelo `Customer` (schema `public`), separada de `User` (staff/superadmin).

Auth: Laravel Sanctum, Bearer token con ability `tourist-app`.

## Endpoints públicos (throttle `tourist-auth`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/tourist/register` | Registro email/contraseña |
| POST | `/api/v1/tourist/login` | Login |
| POST | `/api/v1/tourist/google` | Login/registro con Google ID token |
| POST | `/api/v1/tourist/forgot-password` | Solicitar reset |
| POST | `/api/v1/tourist/reset-password` | Restablecer con token |

## Endpoints autenticados (`Authorization: Bearer …`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tourist/me` | Sesión actual |
| POST | `/api/v1/tourist/logout` | Revoca token actual |
| PATCH | `/api/v1/tourist/profile` | Actualizar nombre/teléfono/avatar |
| PUT | `/api/v1/tourist/password` | Cambiar/crear contraseña |
| DELETE | `/api/v1/tourist/account` | Soft-delete (`confirmation: ELIMINAR`) |

## Variables

```env
TOURIST_GOOGLE_CLIENT_IDS=client1.apps.googleusercontent.com,client2...
```

## Compatibilidad

Las rutas legacy `/api/tourist/restaurants*` se mantienen.
