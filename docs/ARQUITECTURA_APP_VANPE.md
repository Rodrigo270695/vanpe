# VanPe App (Turista) — Arquitectura, estructura y modelo

> Documento técnico para la app móvil de consumo (Android + iOS).
> Stack recomendado: **Expo / React Native + TypeScript**.
> Backend: **Laravel API (Sanctum)** + datos de la plataforma VanPe.

---

## 1. Objetivo de la app

App para **turistas / visitantes**:

- Descubrir restaurantes y puntos turísticos.
- Ver carta, fotos, horarios y disponibilidad.
- Reservar mesa.
- Recibir confirmación y dejar reseña.

**No** es la app del restaurante. El SaaS (mesas, caja, cocina, FEL) sigue siendo **web** (Laravel + Inertia).

---

## 2. Stack móvil

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Framework | **Expo (React Native)** | Un código → Android + iOS |
| Lenguaje | **TypeScript** | Alineado con el frontend web |
| Navegación | Expo Router | Rutas tipo archivo, deep links |
| Estado servidor | TanStack Query | Cache, reintentos, offline ligero |
| Estado UI | Zustand (opcional) | Sesión, filtros, mapa |
| Mapas | `react-native-maps` / Mapbox | Geolocalización |
| Auth API | Laravel Sanctum (token) | Misma plataforma que el SaaS |
| Builds | **EAS Build** | APK/AAB (Android) + IPA (iOS) |
| Push | Expo Notifications | Confirmaciones de reserva |

---

## 3. Arquitectura general

```
┌──────────────────────────────────────────────────────────┐
│                 App VanPe (Expo)                         │
│  Android (APK/AAB)  ·  iOS (IPA)  ·  (opcional PWA)      │
├──────────────────────────────────────────────────────────┤
│  UI (React Native)                                       │
│  · Pantallas (Expo Router)                               │
│  · Componentes de diseño                                 │
│  · Hooks / Query                                         │
├──────────────────────────────────────────────────────────┤
│  Capa de dominio (TypeScript)                            │
│  · types/  · api/  · stores/  · lib/                     │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS JSON
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Laravel API (plataforma)                    │
│  Prefijo: /api/v1/...                                    │
│  Auth: Sanctum (Bearer) · guests permitidos en lectura   │
└──────────────────────────┬───────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
   Datos de plataforma              Datos de tenants
   (turistas, spots,               (carta, mesas,
    eventos, reviews)               horarios, reservas)
```

### Principio clave

- **Un origen de verdad:** lo que el restaurante publica en el SaaS es lo que consume la app.
- **Turistas = usuarios de plataforma**, no de un tenant.
- La app **no** escribe en schemas operativos del restaurante de forma libre: solo crea **reservas / reseñas** vía API controlada.

---

## 4. Modelo de datos (vista app)

### 4.1 Entidades de plataforma (app)

| Entidad | Descripción |
|---------|-------------|
| `Customer` | Turista (cuenta opcional) |
| `TouristSpot` | Centro / punto turístico |
| `Event` | Eventos (temporales o permanentes) |
| `Review` | Reseña de un restaurante por un customer |
| `Reservation` | Reserva de mesa (apunta a un tenant + mesa/slot) |

### 4.2 Entidades expuestas desde tenants (solo lectura / publicación)

| Entidad | Qué ve la app |
|----------|----------------|
| `Tenant` / Restaurante | Nombre, logo, ubicación, rating, tags |
| `Menu` / Carta | Categorías y platos publicados |
| `Availability` | Slots libres para reservar |
| `Hours` | Horarios de atención |
| `Photos` | Galería del local |

### 4.3 Relación conceptual

```
Customer (plataforma)
   │
   ├── Reservation ──► Tenant (restaurante)
   │                      ├── Tables / slots
   │                      ├── Menu (publicado)
   │                      └── Hours / Photos
   │
   └── Review ─────────► Tenant

TouristSpot / Event (contenido VanPe, independiente del tenant)
```

### 4.4 Reglas de modelado

1. `customers` **no** tienen `tenant_id`.
2. `reservations` y `reviews` sí referencian `tenant_id` (o `restaurant_id` público).
3. Solo se muestran restaurantes **publicados** (`publicado = true` + plan/estado válido).
4. Carta y disponibilidad deben ser **datos publicados** (no borradores internos del SaaS).

---

## 5. Estructura del proyecto Expo

```
vanpe-app/
├── app/                          # Expo Router (pantallas)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Explorar / home
│   │   ├── map.tsx               # Mapa
│   │   ├── favorites.tsx
│   │   └── profile.tsx
│   ├── restaurant/
│   │   ├── [id].tsx              # Ficha restaurante
│   │   ├── menu.tsx
│   │   └── reserve.tsx
│   ├── spot/
│   │   └── [id].tsx              # Punto turístico
│   └── reservation/
│       └── [id].tsx              # Detalle / estado reserva
├── src/
│   ├── api/                      # Cliente HTTP + endpoints
│   │   ├── client.ts
│   │   ├── restaurants.ts
│   │   ├── reservations.ts
│   │   ├── spots.ts
│   │   └── auth.ts
│   ├── components/
│   │   ├── map/
│   │   ├── restaurant/
│   │   ├── reservation/
│   │   └── ui/
│   ├── hooks/
│   ├── stores/                   # Sesión, filtros, ubicación
│   ├── types/
│   ├── lib/                      # fechas, dinero, i18n, geo
│   └── theme/
├── assets/
├── app.json / app.config.ts
├── eas.json                      # Perfiles de build
└── package.json
```

> Recomendación: repo separado `vanpe-app` (o monorepo con `apps/mobile`). El SaaS web permanece en `vanpe`.

---

## 6. API que necesita la app (Laravel)

Prefijo sugerido: `/api/v1`.

### Lectura (pública o con token opcional)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/restaurants` | Listado (filtros, geo, búsqueda) |
| `GET` | `/restaurants/{id}` | Ficha |
| `GET` | `/restaurants/{id}/menu` | Carta publicada |
| `GET` | `/restaurants/{id}/availability` | Slots |
| `GET` | `/spots` | Puntos turísticos |
| `GET` | `/spots/{id}` | Detalle spot |
| `GET` | `/events` | Eventos |

### Auth turista

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/auth/register` | Alta customer |
| `POST` | `/auth/login` | Login → token Sanctum |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET` | `/me` | Perfil |

### Escritura (auth)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/reservations` | Crear reserva |
| `GET` | `/reservations` | Mis reservas |
| `GET` | `/reservations/{id}` | Detalle |
| `POST` | `/reservations/{id}/cancel` | Cancelar |
| `POST` | `/reviews` | Crear reseña |

### Contratos importantes

- Respuestas **JSON** tipadas (DTOs estables).
- Paginación cursor/page.
- Errores uniformes (`message`, `errors`).
- Versión `/v1` para no romper la app en producción.

---

## 7. Flujos principales (UX)

### 7.1 Explorar

```
Abrir app → (invitado o logueado)
  → Home / Mapa (ubicación)
  → Lista o pines de restaurantes + spots
  → Filtros: cerca, tipo comida, precio, rating
  → Abrir ficha
```

### 7.2 Reservar

```
Ficha restaurante → Elegir fecha / hora / personas
  → Ver disponibilidad
  → Confirmar (login si hace falta)
  → API crea Reservation
  → Push / pantalla de confirmación
  → El SaaS del restaurante ve la reserva
```

### 7.3 Post-visita

```
Reserva marcada como atendida / pasada
  → App invita a reseñar
  → Review publicada (moderación futura)
```

---

## 8. Capas de la app (responsabilidades)

| Capa | Responsabilidad | No debe |
|------|-----------------|---------|
| **UI** | Render, navegación, formularios | Lógica de negocio pesada |
| **Hooks / Query** | Fetch, cache, loading/error | Hablar SQL / schemas tenant |
| **API client** | HTTP, auth header, retries | UI |
| **Domain types** | Contratos TypeScript | Depender de componentes RN |
| **Backend Laravel** | Auth, reglas, publicación, aislamiento | Conocer detalles de pantallas móviles |

---

## 9. Publicación (Android + Apple)

| Plataforma | Artefacto | Herramienta |
|------------|-----------|-------------|
| Android | **AAB** (Play Store) / APK (pruebas) | EAS Build |
| iOS | **IPA** | EAS Build + Apple Developer |

### Requisitos de cuenta

- Google Play Console (pago único).
- Apple Developer Program (anual).

### Perfiles EAS sugeridos

- `development` → builds internos / Expo Go extendido.
- `preview` → APK/IPA de prueba (TestFlight / internal testing).
- `production` → tiendas.

---

## 10. Seguridad y privacidad

- Tokens Sanctum en almacenamiento seguro (`expo-secure-store`).
- HTTPS obligatorio.
- Permisos solo cuando hacen falta (ubicación, notificaciones, cámara).
- Cumplir **Ley N° 29733** (política de privacidad, consentimiento).
- La app no recibe secretos de APISUNAT ni datos internos de caja/FEL.

---

## 11. Roadmap de implementación (app)

### Fase A — Cimientos

1. Repo Expo + Expo Router + TypeScript.
2. Cliente API + tipos.
3. Auth (login/registro/invitado).
4. Home listado restaurantes (sin mapa aún).

### Fase B — Producto mínimo

5. Ficha restaurante + carta.
6. Disponibilidad + crear reserva.
7. Mis reservas.
8. Mapa + geolocalización.

### Fase C — Tiendas

9. Push notificaciones.
10. Reseñas.
11. Branding, splash, íconos.
12. Builds EAS → Play Store + App Store.

---

## 12. Qué queda fuera de la APK (a propósito)

| Fuera de la app turista | Dónde vive |
|-------------------------|------------|
| Caja, mesas operativas, cocina | SaaS web tenant |
| Facturación SUNAT / Lucode | SaaS web tenant |
| Roles staff (mozo, cajero) | SaaS web tenant |
| Superadmin / planes / tenants | Back-office plataforma |

Si en el futuro se quiere “app para meseros”, sería **otro producto** (otra app o flavor), no mezclarlo con VanPe turista.

---

## 13. Decisión resumida

| Pregunta | Respuesta |
|----------|-----------|
| ¿Lenguaje? | **TypeScript** |
| ¿Framework? | **Expo / React Native** |
| ¿Android + Apple? | **Sí, un solo código** |
| ¿Backend? | **Laravel API + Sanctum** |
| ¿Cómo se genera la APK? | **EAS Build** |
| ¿Modelo de datos? | Turistas en plataforma; restaurantes publicados desde tenants |

---

*Documento vivo. Actualizar cuando exista el repo `vanpe-app` y el primer contrato OpenAPI `/api/v1`.*
