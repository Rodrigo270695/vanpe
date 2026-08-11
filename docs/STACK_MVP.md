# VanPe — Stack tecnológico MVP (Web + APK)

Documento único del stack real del monorepo funcional **VanPe** (plataforma multi-tenant de turismo gastronómico + app turista).

| Pieza | Repo / ruta | Producto |
|-------|-------------|----------|
| **Web / API** | `LaraReact/vanpe` | Panel plataforma, panel restaurante (tenant), API turista, PWA |
| **APK** | `ReactNative/vanpe-app` | App Expo Android (`com.vanpe.app`) |
| **Producción** | `https://vanpe.pe` | API + web; APK apunta a esa URL en EAS `preview`/`production` |

---

## 1. Vista general

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                  │
│  Web (Inertia React)          APK Expo (Android)                 │
│  · Superadmin / plataforma    · Turista                          │
│  · Dueño/staff (subdominio)   · Google Sign-In + push Expo       │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ HTTPS / Sanctum             │ HTTPS / Bearer
                ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Laravel 13 (PHP 8.3) — API + Inertia                │
│  Fortify · Sanctum · Socialite · Spatie Permission · Web Push   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        PostgreSQL (public)              PostgreSQL (rst_*)
        tenants, customers,              schema por restaurante
        catálogo, reservas rsv_*         mesas, menú, staff
```

---

## 2. Backend / Web (`vanpe`)

### Runtime y framework

| Tecnología | Versión (proyecto) | Rol |
|------------|--------------------|-----|
| **PHP** | `^8.3` (local: 8.3.17) | Runtime |
| **Laravel** | `^13.17` (lock: **v13.19.0**) | Framework HTTP, Eloquent, queues |
| **Inertia Laravel** | `^3.0` | Bridge SPA sin API JSON para paneles |
| **Fortify** | `^1.37` | Auth web (login, registro tenant, reset) |
| **Sanctum** | `^4.3` | Tokens API turista (`ability: tourist-app`) |
| **Socialite** | `^5.28` | OAuth Google (web dueños + validación idToken app) |
| **Spatie Permission** | `^8.3` | Roles/permisos plataforma + tenant |
| **Web Push** (`minishlink/web-push`) | `^10.1` | Notificaciones PWA al restaurante |
| **Wayfinder** | `^0.1.14` | Rutas tipadas hacia el front |
| **Pest** | `^4.7` | Tests (dev) |
| **Larastan / Pint** | `^3.9` / `^1.27` | Análisis estático / estilo PHP |

### Frontend web

| Tecnología | Versión (lock aproximada) | Rol |
|------------|---------------------------|-----|
| **React** | **19.2.x** | UI paneles |
| **React DOM** | 19.2.x | Render |
| **Inertia React** | **3.6.x** | Páginas + forms |
| **TypeScript** | **5.9.x** | Tipado |
| **Vite** | **8.1.x** | Bundler |
| **Tailwind CSS** | **4.3.x** | Estilos (+ `@tailwindcss/vite`) |
| **Radix UI** | varias `^1–2` | Primitivos accesibles |
| **Lucide React** | `^0.475` | Iconos |
| **Recharts** | **3.9.x** | Gráficos dashboard |
| **Mapbox GL** | **3.27.x** | Mapa “Mi negocio” / dirección |
| **Sonner** | `^2` | Toasts |
| **ExcelJS** | `^4.4` | Exportes |
| **vite-plugin-pwa** / Workbox | `^1.3` / `7.4.x` | PWA + service worker |
| **ESLint / Prettier** | 9.x / 3.x | Calidad JS |

### Base de datos y persistencia

| Tecnología | Detalle |
|------------|---------|
| **PostgreSQL** | Producción / local real (`DB_CONNECTION=pgsql`) |
| **Schema `public`** | Plataforma: `tenants`, `customers`, catálogo `pub_*`, reservas centrales `rsv_*`, push tokens, preferencias, notificaciones turista |
| **Schemas `rst_*`** | Un schema por restaurante (multi-tenant por schema, no por DB) |
| **Conexiones Laravel** | `pgsql` (siempre `public`) + `tenant` (`search_path` → `rst_xxx, public`) |
| **SQLite** | Solo default de `.env.example` / demos; el MVP operativo usa **PgSQL** |
| **Cache / Queue** | Por defecto `database` (configurable Redis) |
| **Sesiones** | Laravel session (cookie) en web |

### Auth y seguridad (web + API)

| Canal | Mecanismo |
|-------|-----------|
| Superadmin / staff web | Fortify + sesión + Spatie |
| Dueño tenant | Subdominio + Fortify + verificación email |
| Google web (dueños) | Socialite OAuth |
| Turista API | Sanctum Bearer + ability `tourist-app` |
| Turista Google | idToken validado contra `TOURIST_GOOGLE_CLIENT_IDS` |
| Push restaurante | VAPID Web Push |
| Push turista | Expo Push API (`ExponentPushToken[...]`) |

### Dominios multi-tenant

| Concepto | Valor típico |
|----------|--------------|
| Dominio raíz | `vanpe.pe` (`TENANT_ROOT_DOMAIN`) |
| Prefijo schema | `rst_` |
| Resolución | Host → slug tenant → `TenantManager::resolveBySlug` |

---

## 3. App móvil APK (`vanpe-app`)

### Runtime y framework

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Expo SDK** | **~54.0.35** (lock ~54.0.36) | Plataforma managed / EAS |
| **React Native** | **0.81.5** | UI nativa |
| **React** | **19.1.0** | UI (alineado a RN 0.81) |
| **Expo Router** | **~6.0.24** | File-based routing |
| **TypeScript** | **~5.9.2** | Tipado |
| **New Architecture** | `newArchEnabled: true` | Fabric / TurboModules |
| **EAS Build** | CLI ≥ 16 | APK preview / AAB production |
| **Package** | `com.vanpe.app` | Android applicationId |
| **App version** | `1.0.0` | `app.config.ts` |

### Librerías móviles clave

| Librería | Versión | Rol |
|----------|---------|-----|
| **expo-notifications** | ~0.32.17 | Push + canal `reservations` |
| **expo-secure-store** | ~15.0.8 | Token Sanctum |
| **expo-location** | ~19.0.8 | Ubicación / rutas |
| **expo-image** | ~3.0.11 | Imágenes |
| **expo-linear-gradient** | ~15.0.8 | UI |
| **@react-native-google-signin/google-signin** | ^16.1.2 | Login Google nativo |
| **react-native-reanimated** | ~4.1.x | Animaciones (Vampito, hero) |
| **react-native-gesture-handler** | ~2.28 | Gestos / swipe cards |
| **react-i18next** / **i18next** | ^17 / ^26 | ES / EN / PT |
| **@tanstack/react-query** | ^5.101 | Cache HTTP (donde aplique) |
| **@react-navigation/** | ^7 | Tabs / stack (vía expo-router) |
| **Async Storage** | 2.2.0 | Persistencia ligera |
| Fuentes | Outfit / Baloo 2 (Google Fonts Expo) | Branding |

### Builds EAS

| Profile | Artefacto | `EXPO_PUBLIC_API_URL` |
|---------|-----------|----------------------|
| `development` | APK + dev client | local / configurable |
| `preview` | APK interno | `https://vanpe.pe` |
| `production` | AAB | `https://vanpe.pe` |

**Nota:** Google Sign-In y push remoto requieren **Development Build / APK EAS**, no Expo Go (SDK 53+).

---

## 4. Integraciones externas

| Servicio | Uso |
|----------|-----|
| **Google OAuth / Sign-In** | Web (Socialite) + Android (SHA-1 keystore EAS) + Web Client ID (idToken) |
| **Expo Push** | Avisos al turista (reserva confirmada/rechazada) |
| **Web Push VAPID** | Avisos al panel restaurante (nueva reserva app) |
| **Mapbox** | Mapa web + token compartible con app (`MAPBOX_TOKEN` / `EXPO_PUBLIC_MAPBOX_TOKEN`) |
| **Mail** | Transaccional (Brevo u otro vía `MAIL_*` en prod) |

---

## 5. API turista (contrato MVP)

Base: `/api/v1/tourist`

| Área | Endpoints (resumen) |
|------|---------------------|
| Auth | `register`, `login`, `google`, `me`, `logout`, password reset |
| Perfil | `PATCH profile`, `PUT password`, `DELETE account` |
| Preferencias / catálogo | `catalog-options`, `preferences` |
| Catálogo | `restaurants`, `tour-spots`, `tour-spot-categories`, `home`, `recommend` |
| Filtros | `q`, `departamento_id`, `provincia_id`, `distrito_id`, `cuisine`, `category` |
| Reservas | CRUD + `cancel` / `arrive` / `visit` |
| Favoritos / rutas | favorites, tourist routes & stops |
| Push | `device-tokens`, `notifications` |
| Geo | departamentos / provincias / distritos |

---

## 6. MVP funcional cubierto por este stack

### Web
- [x] Multi-tenant schema-per-restaurant (`rst_*`)
- [x] Onboarding dueño + verificación email
- [x] Panel reservas (confirmar / rechazar) → sync central + push turista
- [x] Catálogo público sincronizado (`pub_restaurants`, cocina, horarios)
- [x] PWA + Web Push nuevas reservas
- [x] Google OAuth panel
- [x] Mapbox dirección / mapa negocio

### APK
- [x] Home atmosphere + i18n + catálogo
- [x] Filtros geo + tipo de cocina / categoría
- [x] Auth email + Google (EAS)
- [x] Preferencias IA → recomendados
- [x] Reservas + notificaciones (Expo + inbox)
- [x] Rutas / favoritos / Vampito similares
- [x] EAS preview APK → `vanpe.pe`

---

## 7. Requisitos de entorno (checklist)

### Servidor / local web
```text
PHP >= 8.3
Composer 2
Node.js 20+ (Vite 8)
PostgreSQL 14+ (recomendado 15/16)
Extensiones PHP: pdo_pgsql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath
```

### App
```text
Node.js 20+
Expo CLI / EAS CLI
Cuenta Expo (@vanpe)
JDK + Android SDK solo si prebuild local (opcional; EAS cloud preferido)
```

### Variables críticas
```env
# Web / API
DB_CONNECTION=pgsql
APP_URL=https://vanpe.pe
TENANT_ROOT_DOMAIN=vanpe.pe
TOURIST_GOOGLE_CLIENT_IDS=...web...,...android...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
MAPBOX_TOKEN=...
VITE_MAPBOX_TOKEN=...

# App (EAS / .env)
EXPO_PUBLIC_API_URL=https://vanpe.pe
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_MAPBOX_TOKEN=...
```

---

## 8. Diagrama de versiones “todo en uno”

| Capa | Stack VanPe MVP |
|------|-----------------|
| Lenguaje servidor | PHP **8.3** |
| Framework servidor | Laravel **13.19** |
| SPA paneles | React **19.2** + Inertia **3** + Vite **8** + Tailwind **4** |
| App móvil | Expo **54** + RN **0.81.5** + React **19.1** |
| Navegación app | Expo Router **6** |
| DB | PostgreSQL multi-schema (`public` + `rst_*`) |
| Auth API | Laravel Sanctum **4** |
| Auth web | Fortify **1.37** |
| Roles | Spatie Permission **8** |
| Push turista | Expo Notifications + Expo Push API |
| Push restaurante | Web Push VAPID |
| Mapas | Mapbox GL **3.27** |
| i18n app | i18next **26** |
| CI calidad web | Pint, Larastan, Pest, ESLint, Prettier, `tsc` |

---

*Generado a partir de `composer.json` / lock, `package.json` web y app, `app.config.ts`, `eas.json` y configuración multi-tenant (`config/tenant.php`, `config/database.php`).*
