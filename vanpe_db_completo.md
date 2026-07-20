# VanPe — Arquitectura Completa de Base de Datos
**PostgreSQL 16+ · Multi-Tenant por Schema + Subdominio · UUID v4 · Producción-Ready**
> Plataforma turística y SaaS de restaurantes | Laravel 13 + PostgreSQL 16 + React (Inertia) | 2026
> Documento de arquitectura de datos — v1.0
>
> **Modelo:** Los turistas usan la app **VanPe** para descubrir centros turísticos y restaurantes cercanos y **reservar mesa**. Cada restaurante recibe un **SaaS de gestión propio en su subdominio** (`turestaurante.vanpe.com.pe`) donde solo ve **su** información. La plataforma central (administración) carga el contenido turístico y agrega la oferta de restaurantes para mostrarla al turista.
>
> **Expansión:** Arranque en **Lambayeque** → luego **La Libertad (Trujillo)** y otros. La geografía es un eje de primera clase en el diseño.

---

## Índice general

### PARTE I — FUNDAMENTOS
1. [Filosofía y principios de diseño](#1-filosofía-y-principios-de-diseño)
2. [Arquitectura Multi-Tenant por subdominio](#2-arquitectura-multi-tenant-por-subdominio)
3. [El reto clave: aislar por tenant pero agregar para el turista](#3-el-reto-clave-aislar-por-tenant-pero-agregar-para-el-turista)
4. [Convenciones y tipos de datos](#4-convenciones-y-tipos-de-datos)

### PARTE II — SCHEMA `public` (ADMINISTRACIÓN / SaaS GLOBAL)
#### Módulo A — Plataforma y suscripciones
5. [tenants — Restaurantes registrados](#5-tenants)
6. [plans — Planes de suscripción](#6-plans)
7. [plan_features — Features por plan](#7-plan_features)
8. [subscriptions — Suscripciones activas](#8-subscriptions)
9. [subscription_payments — Historial de cobros](#9-subscription_payments)
10. [promo_codes — Códigos de descuento](#10-promo_codes)

#### Módulo B — Geografía y expansión territorial
11. [geo_ubigeos — Catálogo INEI Perú](#11-geo_ubigeos)
12. [geo_regions — Regiones operativas (Lambayeque, La Libertad...)](#12-geo_regions)
13. [geo_zones — Zonas turísticas dentro de una región](#13-geo_zones)

#### Módulo C — Contenido turístico (cargado por Administración)
14. [tour_categories — Categorías de atractivos](#14-tour_categories)
15. [tour_spots — Centros turísticos](#15-tour_spots)
16. [tour_spot_media — Fotos y videos del atractivo](#16-tour_spot_media)
17. [tour_events — Eventos y actividades (ej. año jubilar)](#17-tour_events)
18. [tour_routes — Rutas / itinerarios turísticos](#18-tour_routes)
19. [tour_route_stops — Paradas de una ruta](#19-tour_route_stops)

#### Módulo D — Catálogo público de restaurantes (proyección para la app)
20. [pub_restaurants — Ficha pública del restaurante](#20-pub_restaurants)
21. [pub_restaurant_media — Galería pública](#21-pub_restaurant_media)
22. [pub_restaurant_hours — Horarios de atención públicos](#22-pub_restaurant_hours)
23. [pub_menu_highlights — Platos destacados publicados](#23-pub_menu_highlights)
24. [pub_availability_slots — Disponibilidad de reservas publicada](#24-pub_availability_slots)

#### Módulo E — App del turista (consumidor)
25. [app_customers — Turistas / usuarios de la app](#25-app_customers)
26. [app_customer_devices — Dispositivos y push tokens](#26-app_customer_devices)
27. [app_customer_consents — Consentimientos Ley 29733](#27-app_customer_consents)
28. [app_favorites — Favoritos del turista](#28-app_favorites)
29. [rsv_reservations — Reservas (central, cross-tenant)](#29-rsv_reservations)
30. [rsv_reservation_events — Historial de la reserva](#30-rsv_reservation_events)
31. [app_reviews — Reseñas y calificaciones](#31-app_reviews)

#### Módulo F — Plataforma: operación y auditoría
32. [platform_notifications — Avisos globales a tenants](#32-platform_notifications)
33. [platform_audit_logs — Auditoría central (inmutable)](#33-platform_audit_logs)

### PARTE III — SCHEMA `rst_*` (POR RESTAURANTE / TENANT)
#### Usuarios y acceso
34. [users — Personal del restaurante](#34-users)
35. [roles / role_user — Roles y permisos](#35-roles--role_user)
36. [sessions · password_reset_tokens · personal_access_tokens](#36-sessions--tokens)

#### Configuración del restaurante
37. [cfg_settings — Configuración general](#37-cfg_settings)
38. [cfg_branches — Sucursales/sedes](#38-cfg_branches)
39. [cfg_service_hours — Horarios de atención](#39-cfg_service_hours)
40. [cfg_closures — Cierres y bloqueos de agenda](#40-cfg_closures)

#### Salón y mesas
41. [rst_areas — Áreas/ambientes (salón, terraza, barra)](#41-rst_areas)
42. [rst_tables — Mesas](#42-rst_tables)

#### Carta / Menú
43. [menu_categories — Categorías de la carta](#43-menu_categories)
44. [menu_dishes — Platos](#44-menu_dishes)
45. [menu_dish_variants — Variantes/tamaños](#45-menu_dish_variants)
46. [menu_modifier_groups — Grupos de modificadores](#46-menu_modifier_groups)
47. [menu_modifiers — Opciones de modificador](#47-menu_modifiers)

#### Reservas (operación local)
48. [reservations — Reservas del restaurante](#48-reservations)
49. [reservation_tables — Mesas asignadas a la reserva](#49-reservation_tables)
50. [waiting_list — Lista de espera](#50-waiting_list)

#### Pedidos, comandas y cocina (KDS)
51. [orders — Pedidos/comandas](#51-orders)
52. [order_items — Detalle del pedido](#52-order_items)
53. [order_item_modifiers — Modificadores del ítem](#53-order_item_modifiers)
54. [kds_tickets — Tickets de cocina](#54-kds_tickets)

#### Caja, ventas y pagos
55. [sales — Ventas / cuentas cerradas](#55-sales)
56. [sale_items — Detalle de venta (snapshot)](#56-sale_items)
57. [payments — Pagos recibidos](#57-payments)
58. [cash_sessions — Sesiones de caja](#58-cash_sessions)

#### Facturación electrónica SUNAT
59. [fel_series — Series de comprobantes](#59-fel_series)
60. [fel_documents — Comprobantes emitidos (inmutable)](#60-fel_documents)
61. [fel_document_items — Detalle del comprobante](#61-fel_document_items)
62. [fel_void_requests — Comunicaciones de baja](#62-fel_void_requests)

#### Inventario (opcional por plan)
63. [inv_suppliers · inv_products · inv_stock_movements](#63-inventario)

#### Publicación y auditoría del tenant
64. [pub_sync_state — Estado de publicación al catálogo público](#64-pub_sync_state)
65. [audit_logs — Auditoría del tenant (inmutable)](#65-audit_logs)

### PARTE IV — LÓGICA DE NEGOCIO Y OPERACIÓN
66. [Sincronización tenant → catálogo público](#66-sincronización-tenant--catálogo-público)
67. [Flujo completo de una reserva (turista → restaurante)](#67-flujo-completo-de-una-reserva)
68. [Aprovisionamiento de un nuevo tenant](#68-aprovisionamiento-de-un-nuevo-tenant)
69. [DNS wildcard y resolución de subdominio](#69-dns-wildcard-y-resolución-de-subdominio)
70. [Orden de migraciones Laravel](#70-orden-de-migraciones-laravel)
71. [Índices críticos y rendimiento](#71-índices-críticos-y-rendimiento)
72. [Seguridad, roles de BD e inmutabilidad](#72-seguridad-roles-de-bd-e-inmutabilidad)

---

## PARTE I — FUNDAMENTOS

---

## 1. Filosofía y principios de diseño

### Principios que guían cada decisión

| Principio | Implementación | Razón |
|-----------|----------------|-------|
| **UUID v4 en entidades de negocio** | `gen_random_uuid()` nativo PostgreSQL 16 | Sin extensión externa; IDs no predecibles ni enumerables en API/subdominio |
| **BIGSERIAL en tablas de altísimo volumen** | `audit_logs`, `stock_movements`, `api logs` | Millones de filas nunca expuestas al API |
| **Soft delete** | `deleted_at TIMESTAMPTZ NULL` | Nunca perder datos operativos ni financieros |
| **TIMESTAMPTZ siempre** | Toda columna fecha+hora | Perú es UTC-5; el servidor puede estar en otra zona |
| **JSONB para datos flexibles** | Config, features, metadata de la carta | Evitar el antipatrón EAV |
| **Snapshot en ventas y comprobantes** | `descripcion_snapshot`, `precio_snapshot` | Los precios cambian; la venta histórica no debe cambiar |
| **Inmutabilidad financiera/legal** | `fel_documents`, `audit_logs`, `payments` → solo INSERT | Integridad tributaria y no repudio |
| **Snake_case universal** | Tablas, columnas, índices, funciones | Consistencia Laravel + PostgreSQL |
| **Prefijos por módulo** | `geo_`, `tour_`, `pub_`, `app_`, `rsv_`, `menu_`, `fel_`, `cfg_` | Claridad visual con muchas tablas |
| **Aislamiento por schema** | Un schema PostgreSQL por restaurante | El motor garantiza el aislamiento; no depende de un `WHERE` |
| **Separación operación / publicación** | El tenant opera en su schema y **publica** un subconjunto al catálogo `public` | La app del turista lee un catálogo agregado, sin acceder a datos internos del restaurante |
| **Geografía de primera clase** | `geo_regions`, `geo_zones`, `geo_ubigeos` | Expansión ordenada Lambayeque → Trujillo → … |
| **Dinero exacto** | `DECIMAL`, nunca `FLOAT` | Precisión contable |
| **CHECK en enums críticos** | Estados, tipos, roles | Validación en la BD, no solo en la app |
| **Índices parciales** | `WHERE deleted_at IS NULL` | Índices más pequeños y rápidos |

### Antipatrones evitados

```sql
-- ❌ NUNCA dinero en FLOAT/REAL
precio FLOAT              -- 149.99 puede volverse 149.9899999 en binario
-- ✅ SIEMPRE DECIMAL exacto
precio DECIMAL(10,2)

-- ❌ NUNCA TIMESTAMP sin zona
created_at TIMESTAMP
-- ✅ SIEMPRE timezone-aware
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- ❌ NUNCA IDs autoincrementales expuestos (enumerables)
GET /api/restaurants/1234
-- ✅ UUID en el API y en el ruteo público
GET /api/restaurants/550e8400-e29b-41d4-a716-446655440000

-- ❌ NUNCA borrar ventas o comprobantes
DELETE FROM sales WHERE id = '...';
-- ✅ Soft delete / anulación formal
UPDATE sales SET deleted_at = NOW() WHERE id = '...';
```

---

## 2. Arquitectura Multi-Tenant por subdominio

### Estrategia: un schema PostgreSQL por restaurante + subdominio propio

```
PostgreSQL 16+  —  Servidor VanPe
│
├── Schema: public                       ← ADMINISTRACIÓN + SaaS GLOBAL + APP TURISTA
│   │
│   ├── [A] Plataforma y suscripciones
│   │     tenants · plans · plan_features · subscriptions
│   │     subscription_payments · promo_codes
│   │
│   ├── [B] Geografía
│   │     geo_ubigeos · geo_regions · geo_zones
│   │
│   ├── [C] Contenido turístico (lo carga Administración)
│   │     tour_categories · tour_spots · tour_spot_media
│   │     tour_events · tour_routes · tour_route_stops
│   │
│   ├── [D] Catálogo público de restaurantes (proyección para la app)
│   │     pub_restaurants · pub_restaurant_media · pub_restaurant_hours
│   │     pub_menu_highlights · pub_availability_slots
│   │
│   ├── [E] App del turista
│   │     app_customers · app_customer_devices · app_customer_consents
│   │     app_favorites · rsv_reservations · rsv_reservation_events · app_reviews
│   │
│   └── [F] Operación de plataforma
│         platform_notifications · platform_audit_logs
│
├── Schema: rst_a1b2c3   ← "El Cántaro" (Lambayeque)   → elcantaro.vanpe.com.pe
│   ├── [usuarios y acceso]      users · roles · sessions · tokens
│   ├── [configuración]          cfg_settings · cfg_branches · cfg_service_hours
│   ├── [salón y mesas]          rst_areas · rst_tables
│   ├── [carta]                  menu_categories · menu_dishes · menu_dish_variants ...
│   ├── [reservas]               reservations · reservation_tables · waiting_list
│   ├── [pedidos y cocina]       orders · order_items · kds_tickets
│   ├── [caja y ventas]          sales · sale_items · payments · cash_sessions
│   ├── [facturación SUNAT]      fel_series · fel_documents · fel_document_items
│   ├── [inventario]             inv_suppliers · inv_products · inv_stock_movements
│   └── [publicación/auditoría]  pub_sync_state · audit_logs
│
├── Schema: rst_d4e5f6   ← "Fiesta Gourmet" (Chiclayo)  → fiestagourmet.vanpe.com.pe
│   └── (misma estructura, aislada)
│
└── Schema: rst_g7h8i9   ← "Mar Picante" (Trujillo)      → marpicante.vanpe.com.pe
    └── (misma estructura, aislada)
```

### Por qué schema-por-tenant (y no una tabla compartida con `tenant_id`)

| Criterio | Shared DB + `tenant_id` | **Schema por tenant** ✅ | DB dedicada |
|----------|-------------------------|--------------------------|-------------|
| Aislamiento de datos | Bajo (depende del `WHERE`) | **Alto (lo garantiza PostgreSQL)** | Muy alto |
| Riesgo de fuga entre restaurantes | Alto si falta el `WHERE` | **Nulo** | Nulo |
| Costo de infraestructura | Muy bajo | **Bajo** | Alto |
| Backup por restaurante | No | **Sí (`pg_dump --schema`)** | Sí |
| "Datos genuinos, solo lo suyo" (tu requisito) | Débil | **Fuerte y natural** | Fuerte |
| Agregar datos para el turista | Trivial | Requiere publicación (ver §3) | Difícil |
| Complejidad de desarrollo | Baja | Media | Alta |

> **Decisión:** Schema por tenant. Es lo que hace tu producto "genuino": cada restaurante entra a **su** subdominio y, a nivel de motor, es imposible que vea datos de otro. El único punto a resolver es cómo el turista ve a **todos** los restaurantes → se resuelve con el **catálogo público** (§3 y Módulo D), no dando acceso cruzado a los schemas.

### Resolución del tenant desde el subdominio (Laravel)

```php
// app/Http/Middleware/ResolveTenant.php
public function handle(Request $request, Closure $next): Response
{
    $host = $request->getHost();                 // elcantaro.vanpe.com.pe
    $slug = explode('.', $host)[0];              // 'elcantaro'

    // El dominio raíz y 'app'/'admin' NO son tenants
    if (in_array($slug, ['vanpe', 'www', 'app', 'admin', 'api'])) {
        return $next($request);
    }

    $tenant = Tenant::where('slug', $slug)
        ->where('estado', '!=', 'cancelled')
        ->firstOrFail();

    abort_if($tenant->estado === 'suspended', 402, 'Suscripción suspendida');

    // Validar el schema antes de usarlo (evita inyección si el dato se corrompe)
    $schema = $tenant->schema_name;
    abort_unless(preg_match('/^rst_[a-z0-9]{6}$/', $schema), 500, 'Schema inválido');

    DB::statement('SET search_path TO "' . $schema . '", public');
    app()->instance('tenant', $tenant);

    return $next($request);
}
```

---

## 3. El reto clave: aislar por tenant pero agregar para el turista

Tu modelo tiene una tensión de diseño central:

- El **restaurante** debe ver **solo lo suyo** → favorece aislamiento fuerte (schema por tenant).
- El **turista** debe ver **todos** los restaurantes en el mapa, buscar, comparar y reservar → necesita datos **agregados**.

Si diéramos al turista acceso directo a los schemas de los tenants, tendríamos que consultar N schemas por cada búsqueda: inviable y peligroso. La solución profesional es un **patrón de publicación (CQRS ligero)**:

```
┌────────────────────────────┐         publica          ┌───────────────────────────┐
│  Schema rst_a1b2c3          │  ─────────────────────►  │  Schema public (catálogo) │
│  (operación privada)        │   solo lo que el          │  pub_restaurants          │
│  menu_dishes, rst_tables,   │   restaurante decide       │  pub_menu_highlights      │
│  reservations, sales...     │   mostrar al turista       │  pub_availability_slots   │
└────────────────────────────┘                            └────────────┬──────────────┘
                                                                        │ lee (rápido, 1 solo schema)
                                                                        ▼
                                                              ┌───────────────────┐
                                                              │   App VanPe       │
                                                              │   (turista)       │
                                                              └───────────────────┘
```

**Cómo funciona:**
1. El restaurante gestiona su carta, mesas, horarios y disponibilidad en **su** schema.
2. Cuando marca un plato como "destacado/visible" o define su disponibilidad de reservas, un **job de publicación** copia ese subconjunto curado a las tablas `pub_*` del schema `public` (Módulo D).
3. La app del turista **solo lee** el catálogo `public.pub_*` (una sola consulta, con geolocalización e índices). Nunca toca los schemas de tenants.
4. La **reserva** que crea el turista se guarda en `public.rsv_reservations` (central) y luego se **proyecta** al schema del restaurante como `reservations` para que la opere.

**Beneficios:** aislamiento real + lecturas del turista rápidas y escalables + el restaurante controla exactamente qué expone ("solo lo que registran", como pediste) + los reportes globales de plataforma salen de `public`.

---

## 4. Convenciones y tipos de datos

```sql
-- ═══════════ IDENTIFICADORES ═══════════
id UUID DEFAULT gen_random_uuid() PRIMARY KEY   -- entidades de negocio
id BIGSERIAL PRIMARY KEY                         -- logs y movimientos de alto volumen

-- ═══════════ DINERO (nunca FLOAT) ═══════════
precio          DECIMAL(10,2)   -- hasta 99,999,999.99
precio_unitario DECIMAL(12,6)   -- comprobantes SUNAT (6 decimales)
porcentaje      DECIMAL(5,2)    -- 18.00, 10.00

-- ═══════════ GEOLOCALIZACIÓN ═══════════
latitud   DECIMAL(9,6)     -- -6.771370
longitud  DECIMAL(9,6)     -- -79.840520
-- (para búsquedas por cercanía se recomienda PostGIS: geography(Point,4326))

-- ═══════════ FECHAS (siempre TIMESTAMPTZ) ═══════════
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at TIMESTAMPTZ NULL              -- NULL = activo
fecha      DATE NOT NULL                 -- sin hora
hora       TIME NOT NULL                 -- sin fecha

-- ═══════════ AUDITORÍA (en toda tabla de negocio) ═══════════
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at    TIMESTAMPTZ NULL,
created_by_id UUID NULL,
updated_by_id UUID NULL

-- ═══════════ TEXTOS ═══════════
nombre   VARCHAR(120)
slug     VARCHAR(120)
email    VARCHAR(150)
telefono VARCHAR(20)
url      VARCHAR(500)
descripcion TEXT
metadata JSONB
```

**Extensiones recomendadas:**

```sql
-- Ejecutar una vez en la base:
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS unaccent;   -- búsquedas sin tildes ("cebiche" = "cébiche")
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- búsqueda difusa por nombre
CREATE EXTENSION IF NOT EXISTS postgis;    -- (recomendado) búsquedas por cercanía geográfica
```

---

## PARTE II — SCHEMA `public` (ADMINISTRACIÓN / SaaS GLOBAL)

---

## 5. `tenants`

Registro maestro de cada restaurante. Es el puente entre el subdominio, el schema y la suscripción.

```sql
CREATE TABLE public.tenants (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identidad / ruteo
    slug             VARCHAR(60) NOT NULL UNIQUE,
    -- slug = subdominio: 'elcantaro' → elcantaro.vanpe.com.pe
    CONSTRAINT chk_tenant_slug CHECK (slug ~ '^[a-z0-9]([a-z0-9\-]{1,58}[a-z0-9])$'),

    schema_name      VARCHAR(20) NOT NULL UNIQUE,
    -- 'rst_' || 6 chars → 'rst_a1b2c3'. Inmutable una vez creado.
    CONSTRAINT chk_tenant_schema CHECK (schema_name ~ '^rst_[a-z0-9]{6}$'),

    -- Datos del restaurante
    razon_social     VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(150) NOT NULL,
    ruc              VARCHAR(11)  NULL UNIQUE,
    CONSTRAINT chk_tenant_ruc CHECK (ruc IS NULL OR ruc ~ '^\d{11}$'),

    email_admin      VARCHAR(150) NOT NULL UNIQUE,
    telefono         VARCHAR(20)  NULL,
    logo_url         VARCHAR(500) NULL,

    -- Ubicación (para catálogo público y expansión territorial)
    region_id        UUID NOT NULL REFERENCES public.geo_regions(id),
    zone_id          UUID NULL     REFERENCES public.geo_zones(id),
    ubigeo_id        INTEGER NULL  REFERENCES public.geo_ubigeos(id),
    direccion        VARCHAR(255) NULL,
    latitud          DECIMAL(9,6) NULL,
    longitud         DECIMAL(9,6) NULL,

    -- Facturación electrónica (credenciales cifradas en capa de app, AES-256)
    fe_provider      VARCHAR(30) NULL,       -- 'nubefact' | 'apisperu' | 'bsale'
    fe_token_enc     TEXT NULL,
    fe_configurado   BOOLEAN NOT NULL DEFAULT FALSE,

    -- Estado del ciclo de vida
    estado           VARCHAR(20) NOT NULL DEFAULT 'trial'
                     CHECK (estado IN ('trial','active','suspended','cancelled')),
    trial_ends_at    TIMESTAMPTZ NULL,
    suspended_at     TIMESTAMPTZ NULL,
    suspension_reason TEXT NULL,
    cancelled_at     TIMESTAMPTZ NULL,

    -- Onboarding
    onboarding_completado BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_paso  SMALLINT NOT NULL DEFAULT 0 CHECK (onboarding_paso BETWEEN 0 AND 5),
    -- 0: datos | 1: mesas | 2: carta | 3: horarios | 4: publicación | 5: completado

    -- Visibilidad en la app del turista
    publicado        BOOLEAN NOT NULL DEFAULT FALSE,
    -- Solo aparece en VanPe cuando el admin/tenant lo publica y la suscripción está activa

    -- Localización
    timezone         VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    locale           VARCHAR(10) NOT NULL DEFAULT 'es_PE',

    -- Marketing / adquisición
    canal_adquisicion VARCHAR(50) NULL,   -- 'campo','referido','facebook','organico'
    referido_por_tenant_id UUID NULL REFERENCES public.tenants(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_tenants_slug     ON public.tenants(slug)   WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_estado   ON public.tenants(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_region   ON public.tenants(region_id);
CREATE INDEX idx_tenants_publicado ON public.tenants(publicado) WHERE publicado = TRUE;
```

---

## 6. `plans`

```sql
CREATE TABLE public.plans (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo         VARCHAR(30) NOT NULL UNIQUE,   -- 'free'|'starter'|'pro'|'premium'
    nombre         VARCHAR(80) NOT NULL,
    descripcion    TEXT NULL,
    badge          VARCHAR(50) NULL,              -- 'Más popular'
    color_hex      VARCHAR(7)  NULL,

    precio_mensual DECIMAL(10,2) NOT NULL DEFAULT 0.00,   -- sin IGV
    precio_anual   DECIMAL(10,2) NULL,
    trial_days     SMALLINT NOT NULL DEFAULT 0,

    -- Modelo mixto: además de la cuota, comisión por reserva concretada
    comision_reserva DECIMAL(6,2) NOT NULL DEFAULT 0.00,  -- S/ por reserva cumplida

    orden          SMALLINT NOT NULL DEFAULT 0,
    es_publico     BOOLEAN NOT NULL DEFAULT TRUE,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.plans (codigo, nombre, descripcion, badge, precio_mensual, comision_reserva, trial_days, orden) VALUES
 ('free',    'Free',    'Aparece en VanPe y gestiona mesas y carta',        NULL,          0.00,   2.00, 0, 1),
 ('starter', 'Starter', 'Reservas ilimitadas y reportes básicos',           NULL,         79.00,   1.00,14, 2),
 ('pro',     'Pro',     'Facturación SUNAT, KDS de cocina y destacados',    'Más popular',149.00,   0.50,14, 3),
 ('premium', 'Premium', 'Multi-sede, inventario y analítica avanzada',     'Mejor valor',249.00,   0.00, 7, 4);
```

> **Nota de negocio:** el plan Free tiene comisión por reserva más alta y el Premium cero comisión. Así capturas restaurantes con barrera de entrada baja (clave para llenar el catálogo) y monetizas por uso o por upgrade.

---

## 7. `plan_features`

```sql
CREATE TABLE public.plan_features (
    id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id  UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature  VARCHAR(60) NOT NULL,
    -- Catálogo de features:
    -- 'max_mesas'          INTEGER (-1 ilimitado)
    -- 'max_usuarios'       INTEGER
    -- 'max_platos'         INTEGER
    -- 'max_reservas_mes'   INTEGER
    -- 'max_sedes'          INTEGER
    -- 'facturacion_sunat'  BOOLEAN
    -- 'modulo_kds'         BOOLEAN
    -- 'modulo_inventario'  BOOLEAN
    -- 'destacado_app'      BOOLEAN   (posicionamiento en VanPe)
    -- 'reportes_avanzados' BOOLEAN
    -- 'soporte_tipo'       STRING 'docs'|'email'|'whatsapp'
    valor_int  INTEGER     NULL,
    valor_bool BOOLEAN     NULL,
    valor_str  VARCHAR(50) NULL,
    CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature)
);
```

---

## 8. `subscriptions`

```sql
CREATE TABLE public.subscriptions (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id      UUID NOT NULL REFERENCES public.plans(id),

    estado       VARCHAR(20) NOT NULL DEFAULT 'trial'
                 CHECK (estado IN ('trial','active','past_due','suspended','cancelled')),
    ciclo        VARCHAR(10) NOT NULL DEFAULT 'monthly'
                 CHECK (ciclo IN ('monthly','yearly')),

    precio_actual DECIMAL(10,2) NOT NULL,   -- snapshot del precio al contratar
    comision_reserva DECIMAL(6,2) NOT NULL DEFAULT 0.00,

    periodo_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    periodo_fin    TIMESTAMPTZ NOT NULL,
    renovacion_automatica BOOLEAN NOT NULL DEFAULT TRUE,
    cancelada_en   TIMESTAMPTZ NULL,

    promo_code_id  UUID NULL REFERENCES public.promo_codes(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_subscription_tenant UNIQUE (tenant_id)  -- una activa por tenant
);

CREATE INDEX idx_subscriptions_estado ON public.subscriptions(estado);
CREATE INDEX idx_subscriptions_fin    ON public.subscriptions(periodo_fin);
```

---

## 9. `subscription_payments`

```sql
CREATE TABLE public.subscription_payments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id),

    concepto        VARCHAR(30) NOT NULL DEFAULT 'suscripcion'
                    CHECK (concepto IN ('suscripcion','comision_reservas','otro')),
    monto           DECIMAL(10,2) NOT NULL,
    moneda          VARCHAR(3) NOT NULL DEFAULT 'PEN',

    estado          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (estado IN ('pending','paid','failed','refunded')),

    pasarela        VARCHAR(30) NULL,   -- 'culqi'|'izipay'|'mercadopago'|'transferencia'
    pasarela_ref    VARCHAR(120) NULL,
    pagado_en       TIMESTAMPTZ NULL,

    periodo_desde   DATE NULL,
    periodo_hasta   DATE NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subpay_tenant ON public.subscription_payments(tenant_id);
CREATE INDEX idx_subpay_estado ON public.subscription_payments(estado);
```

---

## 10. `promo_codes`

```sql
CREATE TABLE public.promo_codes (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo        VARCHAR(30) NOT NULL UNIQUE,
    descripcion   VARCHAR(150) NULL,
    tipo          VARCHAR(15) NOT NULL CHECK (tipo IN ('porcentaje','monto','trial_extra')),
    valor         DECIMAL(10,2) NOT NULL,
    max_usos      INTEGER NULL,
    usos          INTEGER NOT NULL DEFAULT 0,
    valido_desde  DATE NULL,
    valido_hasta  DATE NULL,
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 11. `geo_ubigeos`

Catálogo oficial INEI de ubicaciones geográficas del Perú (departamento/provincia/distrito). Base para direcciones y facturación.

```sql
CREATE TABLE public.geo_ubigeos (
    id            INTEGER PRIMARY KEY,        -- código INEI (6 dígitos)
    departamento  VARCHAR(60) NOT NULL,
    provincia     VARCHAR(60) NOT NULL,
    distrito      VARCHAR(60) NOT NULL,
    codigo_inei   VARCHAR(6)  NOT NULL,
    codigo_reniec VARCHAR(6)  NULL,
    latitud       DECIMAL(9,6) NULL,
    longitud      DECIMAL(9,6) NULL
);

CREATE INDEX idx_ubigeos_depto ON public.geo_ubigeos(departamento);
```

---

## 12. `geo_regions`

Regiones **operativas** de VanPe: define hasta dónde llega la plataforma. Lambayeque primero; luego La Libertad (Trujillo), etc.

```sql
CREATE TABLE public.geo_regions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre        VARCHAR(80) NOT NULL,       -- 'Lambayeque', 'La Libertad'
    slug          VARCHAR(80) NOT NULL UNIQUE,-- 'lambayeque', 'la-libertad'
    departamento  VARCHAR(60) NOT NULL,

    -- Centro del mapa para la app y bounding box de búsqueda
    latitud_centro  DECIMAL(9,6) NOT NULL,
    longitud_centro DECIMAL(9,6) NOT NULL,
    zoom_default    SMALLINT NOT NULL DEFAULT 12,

    -- Estado de expansión
    estado        VARCHAR(15) NOT NULL DEFAULT 'proximamente'
                  CHECK (estado IN ('activa','proximamente','pausada')),
    fecha_lanzamiento DATE NULL,
    orden         SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.geo_regions (nombre, slug, departamento, latitud_centro, longitud_centro, estado, orden) VALUES
 ('Lambayeque',  'lambayeque',  'Lambayeque',  -6.771370, -79.840520, 'activa',        1),
 ('La Libertad', 'la-libertad', 'La Libertad', -8.115900, -79.028800, 'proximamente',  2);
```

---

## 13. `geo_zones`

Zonas turísticas dentro de una región (ej. "Centro Histórico de Chiclayo", "Pimentel", "Lambayeque ciudad"). Sirven para filtrar y agrupar en la app.

```sql
CREATE TABLE public.geo_zones (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id   UUID NOT NULL REFERENCES public.geo_regions(id) ON DELETE CASCADE,
    nombre      VARCHAR(100) NOT NULL,        -- 'Pimentel', 'Centro de Chiclayo'
    slug        VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    latitud_centro  DECIMAL(9,6) NULL,
    longitud_centro DECIMAL(9,6) NULL,
    imagen_url  VARCHAR(500) NULL,
    orden       SMALLINT NOT NULL DEFAULT 0,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_zone_slug UNIQUE (region_id, slug)
);

CREATE INDEX idx_zones_region ON public.geo_zones(region_id);
```

---

## 14. `tour_categories`

Categorías de atractivos turísticos (arqueológico, religioso, playa, museo, gastronómico).

```sql
CREATE TABLE public.tour_categories (
    id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre    VARCHAR(80) NOT NULL,
    slug      VARCHAR(80) NOT NULL UNIQUE,
    icono     VARCHAR(50) NULL,        -- nombre de icono lucide-react
    color_hex VARCHAR(7)  NULL,
    orden     SMALLINT NOT NULL DEFAULT 0,
    activo    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.tour_categories (nombre, slug, icono, orden) VALUES
 ('Religioso',     'religioso',     'church',    1),
 ('Arqueológico',  'arqueologico',  'landmark',  2),
 ('Museo',         'museo',         'building',  3),
 ('Playa',         'playa',         'waves',     4),
 ('Gastronómico',  'gastronomico',  'utensils',  5),
 ('Naturaleza',    'naturaleza',    'trees',     6);
```

---

## 15. `tour_spots`

Centros turísticos que **carga la Administración** de la plataforma (no los restaurantes). Es el contenido que da valor al turista para descubrir la región.

```sql
CREATE TABLE public.tour_spots (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id    UUID NOT NULL REFERENCES public.geo_regions(id),
    zone_id      UUID NULL     REFERENCES public.geo_zones(id),
    category_id  UUID NOT NULL REFERENCES public.tour_categories(id),

    nombre       VARCHAR(150) NOT NULL,       -- 'Museo Tumbas Reales de Sipán'
    slug         VARCHAR(160) NOT NULL UNIQUE,
    resumen      VARCHAR(300) NULL,
    descripcion  TEXT NULL,

    -- Ubicación
    direccion    VARCHAR(255) NULL,
    latitud      DECIMAL(9,6) NOT NULL,
    longitud     DECIMAL(9,6) NOT NULL,

    -- Info práctica
    horario_texto  VARCHAR(200) NULL,         -- 'Mar-Dom 9:00-17:00'
    precio_entrada DECIMAL(8,2) NULL,
    telefono     VARCHAR(20) NULL,
    website      VARCHAR(200) NULL,
    tips         JSONB NULL,                  -- recomendaciones, cómo llegar

    imagen_portada_url VARCHAR(500) NULL,
    rating_promedio    DECIMAL(3,2) NOT NULL DEFAULT 0.00,  -- calculado
    total_resenas      INTEGER NOT NULL DEFAULT 0,

    destacado    BOOLEAN NOT NULL DEFAULT FALSE,
    publicado    BOOLEAN NOT NULL DEFAULT FALSE,
    orden        SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_spots_region   ON public.tour_spots(region_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_spots_category ON public.tour_spots(category_id);
CREATE INDEX idx_spots_publicado ON public.tour_spots(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_spots_geo      ON public.tour_spots(latitud, longitud);
```

---

## 16. `tour_spot_media`

```sql
CREATE TABLE public.tour_spot_media (
    id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spot_id   UUID NOT NULL REFERENCES public.tour_spots(id) ON DELETE CASCADE,
    tipo      VARCHAR(10) NOT NULL DEFAULT 'imagen' CHECK (tipo IN ('imagen','video')),
    url       VARCHAR(500) NOT NULL,
    caption   VARCHAR(200) NULL,
    orden     SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spot_media_spot ON public.tour_spot_media(spot_id);
```

---

## 17. `tour_events`

Eventos y actividades (ej. actividades del año jubilar del Papa, festividades, ferias gastronómicas).

```sql
CREATE TABLE public.tour_events (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id   UUID NOT NULL REFERENCES public.geo_regions(id),
    zone_id     UUID NULL     REFERENCES public.geo_zones(id),
    spot_id     UUID NULL     REFERENCES public.tour_spots(id),

    nombre      VARCHAR(150) NOT NULL,
    slug        VARCHAR(160) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    imagen_url  VARCHAR(500) NULL,

    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin    TIMESTAMPTZ NULL,
    lugar        VARCHAR(200) NULL,
    latitud      DECIMAL(9,6) NULL,
    longitud     DECIMAL(9,6) NULL,
    es_gratuito  BOOLEAN NOT NULL DEFAULT TRUE,
    precio       DECIMAL(8,2) NULL,

    destacado   BOOLEAN NOT NULL DEFAULT FALSE,
    publicado   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_events_fecha  ON public.tour_events(fecha_inicio) WHERE publicado = TRUE;
CREATE INDEX idx_events_region ON public.tour_events(region_id);
```

---

## 18. `tour_routes`

Rutas / itinerarios sugeridos que combinan atractivos y restaurantes (ej. "Ruta gastronómica del norte", "Ruta del Papa"). Gran gancho de marketing.

```sql
CREATE TABLE public.tour_routes (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id   UUID NOT NULL REFERENCES public.geo_regions(id),
    nombre      VARCHAR(150) NOT NULL,
    slug        VARCHAR(160) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    imagen_url  VARCHAR(500) NULL,
    duracion_horas SMALLINT NULL,
    dificultad  VARCHAR(15) NULL CHECK (dificultad IN ('facil','media','dificil')),
    destacado   BOOLEAN NOT NULL DEFAULT FALSE,
    publicado   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 19. `tour_route_stops`

Paradas ordenadas de una ruta. Una parada puede ser un atractivo (`tour_spot`) o un restaurante publicado (`pub_restaurant`).

```sql
CREATE TABLE public.tour_route_stops (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id     UUID NOT NULL REFERENCES public.tour_routes(id) ON DELETE CASCADE,
    orden        SMALLINT NOT NULL,

    tipo         VARCHAR(15) NOT NULL CHECK (tipo IN ('spot','restaurante')),
    spot_id      UUID NULL REFERENCES public.tour_spots(id),
    restaurant_id UUID NULL REFERENCES public.pub_restaurants(id),

    nota         VARCHAR(255) NULL,           -- 'Almuerzo aquí', 'Foto obligatoria'

    CONSTRAINT chk_stop_ref CHECK (
        (tipo = 'spot'        AND spot_id IS NOT NULL AND restaurant_id IS NULL) OR
        (tipo = 'restaurante' AND restaurant_id IS NOT NULL AND spot_id IS NULL)
    ),
    CONSTRAINT uq_route_orden UNIQUE (route_id, orden)
);
```

---

## 20. `pub_restaurants`

**Ficha pública del restaurante**: la proyección que ve el turista en la app. Se alimenta desde el schema del tenant mediante el job de publicación (§66). Aquí NO hay datos operativos internos, solo lo que el restaurante decide exponer.

```sql
CREATE TABLE public.pub_restaurants (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id    UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,

    region_id    UUID NOT NULL REFERENCES public.geo_regions(id),
    zone_id      UUID NULL     REFERENCES public.geo_zones(id),

    nombre       VARCHAR(150) NOT NULL,
    slug         VARCHAR(160) NOT NULL UNIQUE,   -- = tenant.slug
    descripcion  TEXT NULL,

    -- Ubicación para el mapa
    direccion    VARCHAR(255) NULL,
    latitud      DECIMAL(9,6) NOT NULL,
    longitud     DECIMAL(9,6) NOT NULL,
    -- Con PostGIS: geog GEOGRAPHY(Point,4326) para búsquedas por cercanía

    -- Contacto público
    telefono     VARCHAR(20) NULL,
    whatsapp     VARCHAR(20) NULL,

    -- Marketing / clasificación
    tipo_cocina  VARCHAR(80)[] NULL,      -- ['norteña','marina','criolla']
    rango_precio SMALLINT NULL CHECK (rango_precio BETWEEN 1 AND 4),  -- $ a $$$$
    logo_url     VARCHAR(500) NULL,
    portada_url  VARCHAR(500) NULL,

    -- Reservas
    acepta_reservas BOOLEAN NOT NULL DEFAULT TRUE,
    anticipacion_min_horas SMALLINT NOT NULL DEFAULT 1,
    capacidad_max_grupo    SMALLINT NULL,

    -- Métricas (calculadas)
    rating_promedio DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_resenas   INTEGER NOT NULL DEFAULT 0,
    total_reservas  INTEGER NOT NULL DEFAULT 0,

    -- Posicionamiento pagado (monetización: destacados)
    destacado    BOOLEAN NOT NULL DEFAULT FALSE,
    destacado_hasta TIMESTAMPTZ NULL,
    score_ranking DECIMAL(8,4) NOT NULL DEFAULT 0.00,  -- para ordenar resultados

    activo       BOOLEAN NOT NULL DEFAULT TRUE,        -- refleja tenant.publicado + suscripción
    publicado_en TIMESTAMPTZ NULL,
    sincronizado_en TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pubrest_region  ON public.pub_restaurants(region_id) WHERE activo = TRUE;
CREATE INDEX idx_pubrest_zone    ON public.pub_restaurants(zone_id);
CREATE INDEX idx_pubrest_geo     ON public.pub_restaurants(latitud, longitud);
CREATE INDEX idx_pubrest_ranking ON public.pub_restaurants(score_ranking DESC) WHERE activo = TRUE;
-- Con PostGIS (recomendado para "restaurantes cercanos"):
-- CREATE INDEX idx_pubrest_gist ON public.pub_restaurants USING GIST (geog);
```

---

## 21. `pub_restaurant_media`

```sql
CREATE TABLE public.pub_restaurant_media (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    tipo          VARCHAR(10) NOT NULL DEFAULT 'imagen' CHECK (tipo IN ('imagen','video')),
    url           VARCHAR(500) NOT NULL,
    caption       VARCHAR(200) NULL,
    orden         SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_pubmedia_rest ON public.pub_restaurant_media(restaurant_id);
```

---

## 22. `pub_restaurant_hours`

Horarios de atención publicados (para mostrar "Abierto ahora" en la app).

```sql
CREATE TABLE public.pub_restaurant_hours (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    dia_semana    SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),  -- 0=domingo
    hora_apertura TIME NOT NULL,
    hora_cierre   TIME NOT NULL,
    CONSTRAINT uq_pubhours UNIQUE (restaurant_id, dia_semana, hora_apertura)
);
```

---

## 23. `pub_menu_highlights`

Platos destacados que el restaurante decide mostrar en la app (no toda la carta operativa, solo los que quiere exhibir).

```sql
CREATE TABLE public.pub_menu_highlights (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    dish_ref      UUID NOT NULL,               -- id del plato en el schema del tenant
    nombre        VARCHAR(150) NOT NULL,
    descripcion   VARCHAR(300) NULL,
    precio        DECIMAL(10,2) NOT NULL,
    imagen_url    VARCHAR(500) NULL,
    etiquetas     VARCHAR(40)[] NULL,          -- ['recomendado','picante','vegano']
    orden         SMALLINT NOT NULL DEFAULT 0,
    activo        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_highlights_rest ON public.pub_menu_highlights(restaurant_id) WHERE activo = TRUE;
```

---

## 24. `pub_availability_slots`

Disponibilidad de reservas que el restaurante publica (franjas horarias con cupos). Permite que la app muestre horarios reservables sin exponer la gestión interna de mesas.

```sql
CREATE TABLE public.pub_availability_slots (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    fecha         DATE NOT NULL,
    hora          TIME NOT NULL,
    cupos_total   SMALLINT NOT NULL,
    cupos_ocupados SMALLINT NOT NULL DEFAULT 0,
    cupos_disponibles SMALLINT GENERATED ALWAYS AS (cupos_total - cupos_ocupados) STORED,
    cerrado       BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_slot UNIQUE (restaurant_id, fecha, hora),
    CONSTRAINT chk_cupos CHECK (cupos_ocupados <= cupos_total)
);

CREATE INDEX idx_slots_rest_fecha ON public.pub_availability_slots(restaurant_id, fecha)
    WHERE cerrado = FALSE;
```

---

## 25. `app_customers`

Turistas / usuarios de la app VanPe. **Pertenecen a la plataforma, no a un restaurante** (un turista reserva en varios). Esta es una decisión de diseño crítica.

```sql
CREATE TABLE public.app_customers (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    nombre       VARCHAR(120) NOT NULL,
    email        VARCHAR(150) NULL UNIQUE,
    telefono     VARCHAR(20)  NULL,
    password_hash VARCHAR(255) NULL,          -- NULL si es login social/invitado
    avatar_url   VARCHAR(500) NULL,

    -- Datos útiles para analítica de marketing y turismo
    pais         VARCHAR(60) NULL,            -- origen del turista
    ciudad       VARCHAR(80) NULL,
    idioma       VARCHAR(10) NOT NULL DEFAULT 'es',

    proveedor_auth VARCHAR(20) NULL CHECK (proveedor_auth IN ('email','google','apple','facebook')),
    proveedor_id   VARCHAR(150) NULL,

    email_verificado_en TIMESTAMPTZ NULL,
    ultimo_acceso_en    TIMESTAMPTZ NULL,

    estado       VARCHAR(15) NOT NULL DEFAULT 'active'
                 CHECK (estado IN ('active','blocked','deleted')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_customers_email ON public.app_customers(email) WHERE deleted_at IS NULL;
```

---

## 26. `app_customer_devices`

Dispositivos para notificaciones push (confirmación de reserva, recordatorios).

```sql
CREATE TABLE public.app_customer_devices (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id  UUID NOT NULL REFERENCES public.app_customers(id) ON DELETE CASCADE,
    plataforma   VARCHAR(10) NOT NULL CHECK (plataforma IN ('android','ios','web')),
    push_token   VARCHAR(300) NOT NULL,
    modelo       VARCHAR(80) NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_uso_en TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_push_token UNIQUE (push_token)
);

CREATE INDEX idx_devices_customer ON public.app_customer_devices(customer_id) WHERE activo = TRUE;
```

---

## 27. `app_customer_consents`

Consentimientos de datos personales — **cumplimiento Ley N° 29733 (Perú)**.

```sql
CREATE TABLE public.app_customer_consents (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id  UUID NOT NULL REFERENCES public.app_customers(id) ON DELETE CASCADE,
    tipo         VARCHAR(30) NOT NULL
                 CHECK (tipo IN ('terminos','privacidad','marketing','geolocalizacion')),
    otorgado     BOOLEAN NOT NULL,
    version_doc  VARCHAR(20) NULL,           -- versión del documento aceptado
    ip           VARCHAR(45) NULL,
    otorgado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consents_customer ON public.app_customer_consents(customer_id);
```

---

## 28. `app_favorites`

```sql
CREATE TABLE public.app_favorites (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id  UUID NOT NULL REFERENCES public.app_customers(id) ON DELETE CASCADE,
    tipo         VARCHAR(15) NOT NULL CHECK (tipo IN ('restaurante','spot','ruta')),
    restaurant_id UUID NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    spot_id      UUID NULL REFERENCES public.tour_spots(id) ON DELETE CASCADE,
    route_id     UUID NULL REFERENCES public.tour_routes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fav UNIQUE (customer_id, tipo, restaurant_id, spot_id, route_id)
);
```

---

## 29. `rsv_reservations`

**Reserva central (cross-tenant).** El turista la crea desde la app; vive en `public` y se **proyecta** al schema del restaurante como `reservations` (§48). Es la fuente de verdad de la relación turista↔restaurante y la base para el cobro de comisiones.

```sql
CREATE TABLE public.rsv_reservations (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo        VARCHAR(12) NOT NULL UNIQUE,   -- 'VP-8K3M2Q' legible para el turista

    customer_id   UUID NOT NULL REFERENCES public.app_customers(id),
    tenant_id     UUID NOT NULL REFERENCES public.tenants(id),
    restaurant_id UUID NOT NULL REFERENCES public.pub_restaurants(id),

    -- Detalle de la reserva
    fecha         DATE NOT NULL,
    hora          TIME NOT NULL,
    num_personas  SMALLINT NOT NULL CHECK (num_personas > 0),
    nombre_contacto VARCHAR(120) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    notas         VARCHAR(300) NULL,             -- 'aniversario', 'silla de bebé'

    -- Estado (máquina de estados)
    estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','confirmada','sentada','cumplida',
                                    'no_show','cancelada_cliente','cancelada_restaurante')),

    -- Vínculo con la disponibilidad publicada
    slot_id       UUID NULL REFERENCES public.pub_availability_slots(id),

    -- Comisión (monetización)
    comision_aplicada DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    comision_estado   VARCHAR(15) NOT NULL DEFAULT 'na'
                      CHECK (comision_estado IN ('na','pendiente','facturada','anulada')),

    confirmada_en TIMESTAMPTZ NULL,
    cancelada_en  TIMESTAMPTZ NULL,
    cancelada_motivo VARCHAR(200) NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rsv_customer ON public.rsv_reservations(customer_id);
CREATE INDEX idx_rsv_tenant   ON public.rsv_reservations(tenant_id, fecha);
CREATE INDEX idx_rsv_estado   ON public.rsv_reservations(estado);
CREATE INDEX idx_rsv_comision ON public.rsv_reservations(comision_estado)
    WHERE comision_estado = 'pendiente';
```

---

## 30. `rsv_reservation_events`

Historial inmutable de cambios de estado de la reserva (auditoría de quién y cuándo).

```sql
CREATE TABLE public.rsv_reservation_events (
    id             BIGSERIAL PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES public.rsv_reservations(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20) NULL,
    estado_nuevo    VARCHAR(20) NOT NULL,
    actor_tipo     VARCHAR(15) NOT NULL CHECK (actor_tipo IN ('turista','restaurante','sistema')),
    actor_id       UUID NULL,
    nota           VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rsvevents_res ON public.rsv_reservation_events(reservation_id);
```

---

## 31. `app_reviews`

Reseñas y calificaciones de turistas sobre restaurantes o atractivos.

```sql
CREATE TABLE public.app_reviews (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id   UUID NOT NULL REFERENCES public.app_customers(id),

    tipo          VARCHAR(15) NOT NULL CHECK (tipo IN ('restaurante','spot')),
    restaurant_id UUID NULL REFERENCES public.pub_restaurants(id) ON DELETE CASCADE,
    spot_id       UUID NULL REFERENCES public.tour_spots(id) ON DELETE CASCADE,

    -- Solo se puede reseñar restaurante si hubo reserva cumplida (anti-spam)
    reservation_id UUID NULL REFERENCES public.rsv_reservations(id),

    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comentario    TEXT NULL,
    fotos         JSONB NULL,

    respuesta_restaurante TEXT NULL,          -- el restaurante puede responder
    respondido_en TIMESTAMPTZ NULL,

    estado        VARCHAR(15) NOT NULL DEFAULT 'publicada'
                  CHECK (estado IN ('publicada','oculta','reportada')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT chk_review_ref CHECK (
        (tipo = 'restaurante' AND restaurant_id IS NOT NULL) OR
        (tipo = 'spot'        AND spot_id IS NOT NULL)
    )
);

CREATE INDEX idx_reviews_rest ON public.app_reviews(restaurant_id) WHERE estado = 'publicada';
CREATE INDEX idx_reviews_spot ON public.app_reviews(spot_id) WHERE estado = 'publicada';
```

---

## 32. `platform_notifications`

Avisos globales de la administración hacia los tenants (mantenimiento, nuevas features, promos).

```sql
CREATE TABLE public.platform_notifications (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo     VARCHAR(150) NOT NULL,
    cuerpo     TEXT NOT NULL,
    tipo       VARCHAR(15) NOT NULL DEFAULT 'info'
               CHECK (tipo IN ('info','warning','critical','promo')),
    audiencia  VARCHAR(15) NOT NULL DEFAULT 'todos'
               CHECK (audiencia IN ('todos','trial','activos','region')),
    region_id  UUID NULL REFERENCES public.geo_regions(id),
    publicado_desde TIMESTAMPTZ NULL,
    publicado_hasta TIMESTAMPTZ NULL,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 33. `platform_audit_logs`

Auditoría central inmutable (acciones del super-admin, provisioning, cambios de suscripción).

```sql
CREATE TABLE public.platform_audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    actor_tipo  VARCHAR(15) NOT NULL,        -- 'admin','sistema','tenant'
    actor_id    UUID NULL,
    accion      VARCHAR(80) NOT NULL,        -- 'tenant.provisioned','subscription.suspended'
    entidad     VARCHAR(60) NULL,
    entidad_id  UUID NULL,
    datos       JSONB NULL,
    ip          VARCHAR(45) NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pauditlogs_accion ON public.platform_audit_logs(accion);
CREATE INDEX idx_pauditlogs_entidad ON public.platform_audit_logs(entidad, entidad_id);
-- Rol de app SIN UPDATE/DELETE sobre esta tabla (solo INSERT) — ver §72
```

---

## PARTE III — SCHEMA `rst_*` (POR RESTAURANTE / TENANT)

> Todas estas tablas se crean dentro del schema del restaurante (`rst_a1b2c3`, etc.) mediante migraciones específicas (`database/migrations/tenant`). Cada restaurante ve **solo** su propio schema.

---

## 34. `users`

Personal del restaurante (dueño, cajero, mesero, cocina).

```sql
CREATE TABLE users (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono      VARCHAR(20) NULL,
    avatar_url    VARCHAR(500) NULL,

    branch_id     UUID NULL,                 -- sede a la que pertenece (cfg_branches)

    estado        VARCHAR(15) NOT NULL DEFAULT 'active'
                  CHECK (estado IN ('active','inactive','suspended')),
    email_verificado_en TIMESTAMPTZ NULL,
    ultimo_acceso_en    TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

---

## 35. `roles` / `role_user`

```sql
CREATE TABLE roles (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo      VARCHAR(30) NOT NULL UNIQUE,   -- 'owner','manager','cashier','waiter','kitchen'
    nombre      VARCHAR(60) NOT NULL,
    permisos    JSONB NOT NULL DEFAULT '[]',   -- ['reservas.gestionar','carta.editar',...]
    es_sistema  BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO roles (codigo, nombre, es_sistema) VALUES
 ('owner',   'Dueño',    TRUE),
 ('manager', 'Gerente',  TRUE),
 ('cashier', 'Cajero',   TRUE),
 ('waiter',  'Mesero',   TRUE),
 ('kitchen', 'Cocina',   TRUE);

CREATE TABLE role_user (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

---

## 36. `sessions` / tokens

```sql
CREATE TABLE sessions (
    id            VARCHAR(255) PRIMARY KEY,
    user_id       UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address    VARCHAR(45) NULL,
    user_agent    TEXT NULL,
    payload       TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_last ON sessions(last_activity);

CREATE TABLE password_reset_tokens (
    email      VARCHAR(150) PRIMARY KEY,
    token      VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NULL
);

CREATE TABLE personal_access_tokens (
    id             BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id   UUID NOT NULL,
    name           VARCHAR(255) NOT NULL,
    token          VARCHAR(64) NOT NULL UNIQUE,
    abilities      TEXT NULL,
    last_used_at   TIMESTAMPTZ NULL,
    expires_at     TIMESTAMPTZ NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 37. `cfg_settings`

Configuración general del restaurante (una sola fila).

```sql
CREATE TABLE cfg_settings (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moneda          VARCHAR(3) NOT NULL DEFAULT 'PEN',
    igv_porcentaje  DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    incluye_igv_precios BOOLEAN NOT NULL DEFAULT TRUE,

    -- Reservas
    permite_reservas BOOLEAN NOT NULL DEFAULT TRUE,
    duracion_reserva_min SMALLINT NOT NULL DEFAULT 90,  -- minutos por mesa
    anticipacion_min_horas SMALLINT NOT NULL DEFAULT 1,
    anticipacion_max_dias  SMALLINT NOT NULL DEFAULT 30,
    tolerancia_no_show_min SMALLINT NOT NULL DEFAULT 15,

    -- Publicación en VanPe
    auto_publicar   BOOLEAN NOT NULL DEFAULT TRUE,

    metadata        JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Garantiza una única fila de configuración
    singleton       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_cfg_singleton UNIQUE (singleton)
);
```

---

## 38. `cfg_branches`

Sucursales/sedes (para restaurantes con más de un local; plan Premium).

```sql
CREATE TABLE cfg_branches (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre     VARCHAR(120) NOT NULL,
    direccion  VARCHAR(255) NULL,
    telefono   VARCHAR(20) NULL,
    latitud    DECIMAL(9,6) NULL,
    longitud   DECIMAL(9,6) NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
```

---

## 39. `cfg_service_hours`

```sql
CREATE TABLE cfg_service_hours (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id     UUID NULL REFERENCES cfg_branches(id) ON DELETE CASCADE,
    dia_semana    SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_apertura TIME NOT NULL,
    hora_cierre   TIME NOT NULL,
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_service_hours UNIQUE (branch_id, dia_semana, hora_apertura)
);
```

---

## 40. `cfg_closures`

Cierres puntuales o bloqueos de agenda (feriados, evento privado).

```sql
CREATE TABLE cfg_closures (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id   UUID NULL REFERENCES cfg_branches(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin    TIMESTAMPTZ NOT NULL,
    motivo      VARCHAR(200) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 41. `rst_areas`

Áreas/ambientes del restaurante (salón principal, terraza, barra, VIP).

```sql
CREATE TABLE rst_areas (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id  UUID NULL REFERENCES cfg_branches(id) ON DELETE CASCADE,
    nombre     VARCHAR(80) NOT NULL,
    descripcion VARCHAR(200) NULL,
    orden      SMALLINT NOT NULL DEFAULT 0,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 42. `rst_tables`

Mesas físicas del restaurante.

```sql
CREATE TABLE rst_tables (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    area_id    UUID NOT NULL REFERENCES rst_areas(id) ON DELETE CASCADE,
    branch_id  UUID NULL REFERENCES cfg_branches(id),
    numero     VARCHAR(20) NOT NULL,          -- 'M1', 'Terraza-3'
    capacidad  SMALLINT NOT NULL DEFAULT 4,
    capacidad_max SMALLINT NULL,

    estado     VARCHAR(15) NOT NULL DEFAULT 'libre'
               CHECK (estado IN ('libre','ocupada','reservada','inactiva')),

    -- Posición en el plano visual del salón (drag & drop)
    pos_x      SMALLINT NULL,
    pos_y      SMALLINT NULL,
    forma      VARCHAR(15) NULL CHECK (forma IN ('cuadrada','redonda','rectangular')),

    qr_token   VARCHAR(40) NULL UNIQUE,       -- QR en mesa para pedir/ver carta
    reservable BOOLEAN NOT NULL DEFAULT TRUE,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_table_numero UNIQUE (branch_id, numero)
);

CREATE INDEX idx_tables_area   ON rst_tables(area_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tables_estado ON rst_tables(estado);
```

---

## 43. `menu_categories`

```sql
CREATE TABLE menu_categories (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre     VARCHAR(80) NOT NULL,          -- 'Entradas', 'Platos de fondo', 'Bebidas'
    descripcion VARCHAR(200) NULL,
    imagen_url VARCHAR(500) NULL,
    orden      SMALLINT NOT NULL DEFAULT 0,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
```

---

## 44. `menu_dishes`

Platos de la carta. La bandera `publicar_en_app` controla qué se expone al catálogo público.

```sql
CREATE TABLE menu_dishes (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id  UUID NOT NULL REFERENCES menu_categories(id),

    nombre       VARCHAR(150) NOT NULL,
    descripcion  VARCHAR(400) NULL,
    precio       DECIMAL(10,2) NOT NULL,
    imagen_url   VARCHAR(500) NULL,

    -- Clasificación / filtros para el turista
    etiquetas    VARCHAR(40)[] NULL,          -- ['picante','vegano','sin_gluten','recomendado']
    tiempo_prep_min SMALLINT NULL,
    calorias     SMALLINT NULL,

    disponible   BOOLEAN NOT NULL DEFAULT TRUE,   -- disponibilidad del día
    publicar_en_app BOOLEAN NOT NULL DEFAULT FALSE, -- se envía a pub_menu_highlights
    destacado    BOOLEAN NOT NULL DEFAULT FALSE,

    orden        SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_dishes_category ON menu_dishes(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dishes_app      ON menu_dishes(publicar_en_app) WHERE publicar_en_app = TRUE;
```

---

## 45. `menu_dish_variants`

Variantes/tamaños (personal/familiar, con o sin guarnición).

```sql
CREATE TABLE menu_dish_variants (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dish_id    UUID NOT NULL REFERENCES menu_dishes(id) ON DELETE CASCADE,
    nombre     VARCHAR(80) NOT NULL,          -- 'Personal', 'Familiar'
    precio     DECIMAL(10,2) NOT NULL,
    orden      SMALLINT NOT NULL DEFAULT 0,
    activo     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_variants_dish ON menu_dish_variants(dish_id);
```

---

## 46. `menu_modifier_groups`

Grupos de modificadores (ej. "Término de la carne", "Agregados").

```sql
CREATE TABLE menu_modifier_groups (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dish_id    UUID NOT NULL REFERENCES menu_dishes(id) ON DELETE CASCADE,
    nombre     VARCHAR(80) NOT NULL,
    min_selecciones SMALLINT NOT NULL DEFAULT 0,
    max_selecciones SMALLINT NOT NULL DEFAULT 1,
    obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
    orden      SMALLINT NOT NULL DEFAULT 0
);
```

---

## 47. `menu_modifiers`

```sql
CREATE TABLE menu_modifiers (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id   UUID NOT NULL REFERENCES menu_modifier_groups(id) ON DELETE CASCADE,
    nombre     VARCHAR(80) NOT NULL,          -- 'Término medio', 'Extra queso'
    precio_extra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    orden      SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_modifiers_group ON menu_modifiers(group_id);
```

---

## 48. `reservations`

Reserva **proyectada** desde `public.rsv_reservations` al schema del restaurante para que la opere el staff. Guarda el `rsv_id` central como referencia.

```sql
CREATE TABLE reservations (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rsv_id        UUID NOT NULL UNIQUE,        -- referencia a public.rsv_reservations.id
    codigo        VARCHAR(12) NOT NULL,

    -- Datos del turista (copiados, el schema tenant no accede a app_customers)
    cliente_nombre   VARCHAR(120) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,

    fecha         DATE NOT NULL,
    hora          TIME NOT NULL,
    num_personas  SMALLINT NOT NULL,
    notas         VARCHAR(300) NULL,
    origen        VARCHAR(15) NOT NULL DEFAULT 'app'
                  CHECK (origen IN ('app','manual','telefono','walkin')),

    estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','confirmada','sentada','cumplida',
                                    'no_show','cancelada_cliente','cancelada_restaurante')),

    branch_id     UUID NULL REFERENCES cfg_branches(id),
    sale_id       UUID NULL,                   -- venta asociada al cumplirse

    confirmada_en TIMESTAMPTZ NULL,
    sentada_en    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_fecha  ON reservations(fecha, hora);
CREATE INDEX idx_reservations_estado ON reservations(estado);
```

---

## 49. `reservation_tables`

Mesas asignadas a una reserva (una reserva grande puede unir mesas).

```sql
CREATE TABLE reservation_tables (
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    table_id       UUID NOT NULL REFERENCES rst_tables(id),
    PRIMARY KEY (reservation_id, table_id)
);
```

---

## 50. `waiting_list`

```sql
CREATE TABLE waiting_list (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_nombre VARCHAR(120) NOT NULL,
    cliente_telefono VARCHAR(20) NULL,
    num_personas  SMALLINT NOT NULL,
    hora_llegada  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado        VARCHAR(15) NOT NULL DEFAULT 'esperando'
                  CHECK (estado IN ('esperando','sentado','retirado')),
    notas         VARCHAR(200) NULL
);
```

---

## 51. `orders`

Pedidos/comandas de una mesa.

```sql
CREATE TABLE orders (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero        VARCHAR(20) NOT NULL,        -- correlativo diario visible
    table_id      UUID NULL REFERENCES rst_tables(id),
    reservation_id UUID NULL REFERENCES reservations(id),
    branch_id     UUID NULL REFERENCES cfg_branches(id),
    mesero_id     UUID NULL REFERENCES users(id),

    tipo          VARCHAR(15) NOT NULL DEFAULT 'salon'
                  CHECK (tipo IN ('salon','llevar','delivery')),
    estado        VARCHAR(15) NOT NULL DEFAULT 'abierta'
                  CHECK (estado IN ('abierta','enviada_cocina','servida','cerrada','anulada')),

    subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total         DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    notas         VARCHAR(300) NULL,
    abierta_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cerrada_en    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_table  ON orders(table_id);
CREATE INDEX idx_orders_estado ON orders(estado);
CREATE INDEX idx_orders_fecha  ON orders(abierta_en);
```

---

## 52. `order_items`

Detalle del pedido con **snapshot** de nombre y precio (el histórico no cambia si luego editas la carta).

```sql
CREATE TABLE order_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id       UUID NULL REFERENCES menu_dishes(id),
    variant_id    UUID NULL REFERENCES menu_dish_variants(id),

    nombre_snapshot VARCHAR(150) NOT NULL,
    precio_snapshot DECIMAL(10,2) NOT NULL,
    cantidad      SMALLINT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    subtotal      DECIMAL(10,2) NOT NULL,

    estado_cocina VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado_cocina IN ('pendiente','preparando','listo','servido','anulado')),
    notas         VARCHAR(200) NULL,           -- 'sin cebolla'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orderitems_order ON order_items(order_id);
```

---

## 53. `order_item_modifiers`

```sql
CREATE TABLE order_item_modifiers (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id   UUID NULL REFERENCES menu_modifiers(id),
    nombre_snapshot VARCHAR(80) NOT NULL,
    precio_snapshot DECIMAL(10,2) NOT NULL DEFAULT 0.00
);
```

---

## 54. `kds_tickets`

Tickets para la pantalla de cocina (Kitchen Display System). Plan Pro+.

```sql
CREATE TABLE kds_tickets (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    estacion   VARCHAR(30) NULL,              -- 'cocina_caliente','barra','postres'
    estado     VARCHAR(15) NOT NULL DEFAULT 'nuevo'
               CHECK (estado IN ('nuevo','en_proceso','listo','entregado')),
    prioridad  SMALLINT NOT NULL DEFAULT 0,
    recibido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    listo_en   TIMESTAMPTZ NULL
);

CREATE INDEX idx_kds_estado ON kds_tickets(estado, recibido_en);
```

---

## 55. `sales`

Venta / cuenta cerrada.

```sql
CREATE TABLE sales (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero        VARCHAR(20) NOT NULL,
    order_id      UUID NULL REFERENCES orders(id),
    reservation_id UUID NULL REFERENCES reservations(id),
    cash_session_id UUID NULL,
    cajero_id     UUID NULL REFERENCES users(id),
    branch_id     UUID NULL REFERENCES cfg_branches(id),

    subtotal      DECIMAL(10,2) NOT NULL,
    igv           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total         DECIMAL(10,2) NOT NULL,

    estado        VARCHAR(15) NOT NULL DEFAULT 'pagada'
                  CHECK (estado IN ('pendiente','pagada','anulada')),
    -- Vínculo con comprobante electrónico (si se emitió)
    fel_document_id UUID NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_sales_fecha ON sales(created_at);
CREATE INDEX idx_sales_estado ON sales(estado);
```

---

## 56. `sale_items`

```sql
CREATE TABLE sale_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    nombre_snapshot VARCHAR(150) NOT NULL,
    precio_snapshot DECIMAL(10,2) NOT NULL,
    cantidad      SMALLINT NOT NULL,
    subtotal      DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_saleitems_sale ON sale_items(sale_id);
```

---

## 57. `payments`

Pagos recibidos (inmutable: solo INSERT; una anulación es otro registro).

```sql
CREATE TABLE payments (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id      UUID NOT NULL REFERENCES sales(id),
    metodo       VARCHAR(20) NOT NULL
                 CHECK (metodo IN ('efectivo','tarjeta','yape','plin','transferencia')),
    monto        DECIMAL(10,2) NOT NULL,
    referencia   VARCHAR(100) NULL,           -- código de operación
    recibido_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cajero_id    UUID NULL REFERENCES users(id)
);

CREATE INDEX idx_payments_sale ON payments(sale_id);
```

---

## 58. `cash_sessions`

Apertura/cierre de caja.

```sql
CREATE TABLE cash_sessions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id     UUID NULL REFERENCES cfg_branches(id),
    cajero_id     UUID NOT NULL REFERENCES users(id),
    monto_apertura DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre  DECIMAL(10,2) NULL,
    total_ventas  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado        VARCHAR(10) NOT NULL DEFAULT 'abierta'
                  CHECK (estado IN ('abierta','cerrada')),
    abierta_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cerrada_en    TIMESTAMPTZ NULL
);
```

---

## 59. `fel_series`

Series de comprobantes electrónicos SUNAT.

```sql
CREATE TABLE fel_series (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id    UUID NULL REFERENCES cfg_branches(id),
    tipo_comprobante VARCHAR(2) NOT NULL CHECK (tipo_comprobante IN ('01','03')),
    -- 01=Factura, 03=Boleta
    serie        VARCHAR(4) NOT NULL,          -- 'F001','B001'
    correlativo  INTEGER NOT NULL DEFAULT 0,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_fel_serie UNIQUE (tipo_comprobante, serie)
);
```

---

## 60. `fel_documents`

Comprobantes emitidos. **Inmutable (solo INSERT).**

```sql
CREATE TABLE fel_documents (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id       UUID NOT NULL REFERENCES sales(id),
    serie_id      UUID NOT NULL REFERENCES fel_series(id),

    tipo_comprobante VARCHAR(2) NOT NULL,
    serie         VARCHAR(4) NOT NULL,
    correlativo   INTEGER NOT NULL,
    numero_completo VARCHAR(20) NOT NULL,      -- 'B001-00001234'

    -- Cliente
    cliente_tipo_doc VARCHAR(1) NOT NULL DEFAULT '0'
                     CHECK (cliente_tipo_doc IN ('0','1','6')), -- 0=SinDoc,1=DNI,6=RUC
    cliente_num_doc  VARCHAR(11) NULL,
    cliente_nombre   VARCHAR(200) NULL,

    -- Montos
    op_gravada    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    igv           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total         DECIMAL(12,2) NOT NULL,
    moneda        VARCHAR(3) NOT NULL DEFAULT 'PEN',

    -- Estado SUNAT / proveedor
    estado_sunat  VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado_sunat IN ('pendiente','aceptado','rechazado','anulado')),
    hash_cpe      VARCHAR(100) NULL,
    xml_url       VARCHAR(500) NULL,
    pdf_url       VARCHAR(500) NULL,
    cdr_url       VARCHAR(500) NULL,
    respuesta_sunat JSONB NULL,

    emitido_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fel_numero UNIQUE (serie, correlativo)
);

CREATE INDEX idx_fel_sale   ON fel_documents(sale_id);
CREATE INDEX idx_fel_estado ON fel_documents(estado_sunat);
```

---

## 61. `fel_document_items`

```sql
CREATE TABLE fel_document_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id   UUID NOT NULL REFERENCES fel_documents(id) ON DELETE CASCADE,
    descripcion   VARCHAR(250) NOT NULL,
    cantidad      DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,6) NOT NULL,
    valor_unitario  DECIMAL(12,6) NOT NULL,   -- sin IGV
    igv           DECIMAL(12,2) NOT NULL,
    total         DECIMAL(12,2) NOT NULL
);
```

---

## 62. `fel_void_requests`

Comunicaciones de baja / anulación a SUNAT.

```sql
CREATE TABLE fel_void_requests (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id  UUID NOT NULL REFERENCES fel_documents(id),
    motivo       VARCHAR(200) NOT NULL,
    estado       VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','aceptado','rechazado')),
    ticket_sunat VARCHAR(100) NULL,
    solicitado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    procesado_en TIMESTAMPTZ NULL
);
```

---

## 63. Inventario

Módulo opcional (plan Premium). Se incluye simplificado.

```sql
CREATE TABLE inv_suppliers (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre     VARCHAR(150) NOT NULL,
    ruc        VARCHAR(11) NULL,
    telefono   VARCHAR(20) NULL,
    email      VARCHAR(150) NULL,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE inv_products (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    unidad       VARCHAR(20) NOT NULL DEFAULT 'unidad',  -- kg, litro, unidad
    stock_actual DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    costo_promedio DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Kardex inmutable (solo INSERT)
CREATE TABLE inv_stock_movements (
    id           BIGSERIAL PRIMARY KEY,
    product_id   UUID NOT NULL REFERENCES inv_products(id),
    tipo         VARCHAR(15) NOT NULL CHECK (tipo IN ('ingreso','salida','ajuste','merma')),
    cantidad     DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(10,4) NULL,
    referencia   VARCHAR(120) NULL,
    user_id      UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stockmov_product ON inv_stock_movements(product_id, created_at);
```

---

## 64. `pub_sync_state`

Estado de la sincronización del tenant hacia el catálogo público (§66). Ayuda a saber qué falta publicar y detectar errores.

```sql
CREATE TABLE pub_sync_state (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entidad       VARCHAR(30) NOT NULL,        -- 'ficha','carta','horarios','disponibilidad'
    ultimo_sync_en TIMESTAMPTZ NULL,
    ultimo_hash   VARCHAR(64) NULL,            -- hash del payload para evitar re-envíos
    estado        VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','sincronizado','error')),
    error_mensaje TEXT NULL,
    CONSTRAINT uq_syncstate_entidad UNIQUE (entidad)
);
```

---

## 65. `audit_logs`

Auditoría del tenant. **Inmutable (solo INSERT).**

```sql
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NULL REFERENCES users(id),
    accion      VARCHAR(80) NOT NULL,          -- 'reserva.confirmada','venta.anulada'
    entidad     VARCHAR(60) NULL,
    entidad_id  UUID NULL,
    datos_antes JSONB NULL,
    datos_despues JSONB NULL,
    ip          VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditlogs_user   ON audit_logs(user_id);
CREATE INDEX idx_auditlogs_accion ON audit_logs(accion);
CREATE INDEX idx_auditlogs_entidad ON audit_logs(entidad, entidad_id);
```

---

## PARTE IV — LÓGICA DE NEGOCIO Y OPERACIÓN

---

## 66. Sincronización tenant → catálogo público

El restaurante trabaja en su schema; VanPe muestra al turista una proyección en `public`. La sincronización es **unidireccional** (tenant → public) y se dispara por eventos + un job de respaldo.

**Qué se publica:**

| Origen (schema tenant) | Destino (schema public) | Disparador |
|------------------------|-------------------------|------------|
| `tenants` + `cfg_settings` | `pub_restaurants` | Al editar ficha / publicar |
| `menu_dishes` (`publicar_en_app = TRUE`) | `pub_menu_highlights` | Al marcar plato visible |
| `cfg_service_hours` | `pub_restaurant_hours` | Al editar horarios |
| Cálculo de cupos por mesas/reservas | `pub_availability_slots` | Job diario + al reservar |

```php
// app/Jobs/PublishRestaurantToCatalog.php
public function handle(): void
{
    $tenant = Tenant::find($this->tenantId);

    // 1. Solo publica si la suscripción está activa y el tenant marcó "publicado"
    if (! $tenant->publicado || $tenant->estado === 'suspended') {
        DB::table('public.pub_restaurants')->where('tenant_id', $tenant->id)
            ->update(['activo' => false]);
        return;
    }

    // 2. Leer del schema del tenant
    DB::statement('SET search_path TO "' . $tenant->schema_name . '", public');
    $settings = DB::table('cfg_settings')->first();
    $dishes   = DB::table('menu_dishes')->where('publicar_en_app', true)
                    ->where('disponible', true)->whereNull('deleted_at')->get();

    // 3. Upsert idempotente en public (usando pub_sync_state.ultimo_hash para no repetir)
    DB::table('public.pub_restaurants')->upsert([...], ['tenant_id'], [...]);
    // ... publicar highlights, horarios, disponibilidad ...
}
```

**Reglas clave:**
- Si el tenant se **suspende por impago** → `pub_restaurants.activo = FALSE` (desaparece de la app automáticamente). Fuerte incentivo de pago.
- La publicación es **idempotente** (compara hash en `pub_sync_state`) para no saturar la BD.
- El turista **nunca** consulta schemas de tenants: solo lee `public.pub_*`.

---

## 67. Flujo completo de una reserva

```
TURISTA (app)                    PLATAFORMA (public)              RESTAURANTE (rst_xxx)
     │                                  │                                │
     │ 1. Busca restaurantes cercanos   │                                │
     │─────────────────────────────────►│ lee pub_restaurants (geo)      │
     │◄─────────────────────────────────│                                │
     │ 2. Ve carta destacada + slots    │ lee pub_menu_highlights         │
     │    disponibles                    │ + pub_availability_slots        │
     │ 3. Crea reserva (fecha/hora/pax) │                                │
     │─────────────────────────────────►│ INSERT rsv_reservations         │
     │                                  │ (estado=pendiente)              │
     │                                  │ ocupa cupo en slot              │
     │                                  │ proyecta ──────────────────────►│ INSERT reservations
     │                                  │                                 │ (notifica al staff)
     │                                  │◄────────────────────────────────│ 4. Restaurante confirma
     │◄── push "Reserva confirmada" ────│ UPDATE estado=confirmada         │    (o rechaza)
     │                                  │ (propaga a ambos schemas)        │
     │ 5. Asiste ──────────────────────►│                                 │ estado=sentada → cumplida
     │                                  │ 6. Al cumplirse:                 │
     │                                  │    comision_estado=pendiente     │
     │                                  │    (se factura al restaurante)   │
     │ 7. Deja reseña ─────────────────►│ INSERT app_reviews               │
     │                                  │ recalcula rating pub_restaurants │
```

**Consistencia:** la reserva es la fuente de verdad en `public.rsv_reservations`; el schema del tenant tiene una copia operativa. Los cambios de estado se propagan en ambos sentidos mediante eventos/jobs y quedan registrados en `rsv_reservation_events` (central) y `audit_logs` (tenant).

---

## 68. Aprovisionamiento de un nuevo tenant

```php
// app/Services/TenantProvisioningService.php
public function provision(array $data): Tenant
{
    return DB::transaction(function () use ($data) {
        // 1. Crear registro central
        $tenant = Tenant::create([
            'slug'        => $data['slug'],                 // 'elcantaro'
            'schema_name' => 'rst_' . Str::lower(Str::random(6)),
            'razon_social'=> $data['razon_social'],
            'nombre_comercial' => $data['nombre_comercial'],
            'region_id'   => $data['region_id'],            // Lambayeque
            'estado'      => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        // 2. Crear el schema físico
        $schema = $tenant->schema_name;
        DB::statement("CREATE SCHEMA IF NOT EXISTS \"$schema\"");

        // 3. Migrar las tablas del tenant en ese schema
        DB::statement("SET search_path TO \"$schema\", public");
        Artisan::call('migrate', [
            '--path'  => 'database/migrations/tenant',
            '--force' => true,
        ]);

        // 4. Seed inicial: settings, roles, usuario owner
        DB::table('cfg_settings')->insert(['id' => Str::uuid()]);
        // ...roles ya vienen en migración seed...
        DB::table('users')->insert([
            'id' => Str::uuid(),
            'nombre' => $data['owner_nombre'],
            'email'  => $tenant->email_admin,
            'password_hash' => Hash::make($data['password']),
        ]);

        // 5. Suscripción trial
        Subscription::create([...]);

        // 6. Ficha pública vacía (aún no publicada)
        DB::table('public.pub_restaurants')->insert([...'activo' => false]);

        // 7. Auditoría
        DB::table('public.platform_audit_logs')->insert([
            'accion' => 'tenant.provisioned', 'entidad' => 'tenants',
            'entidad_id' => $tenant->id, 'datos' => json_encode(['slug' => $tenant->slug]),
        ]);

        return $tenant;
    });
}
```

---

## 69. DNS wildcard y resolución de subdominio

```
Registro DNS:
  *.vanpe.com.pe        A / CNAME → servidor VanPe
  vanpe.com.pe          → landing pública
  app.vanpe.com.pe      → app del turista (PWA/web) o deep link
  admin.vanpe.com.pe    → back-office (super-admin)
  <slug>.vanpe.com.pe   → panel SaaS del restaurante (tenant)
```

- **Wildcard SSL**: certificado `*.vanpe.com.pe` (Let's Encrypt wildcard vía DNS-01, o el proveedor de hosting).
- El middleware `ResolveTenant` (§2) extrae el `slug`, valida contra `tenants` y hace `SET search_path`.
- Subdominios reservados (`www`, `app`, `admin`, `api`) se excluyen del ruteo de tenant.
- Validar el `slug` en el registro (`chk_tenant_slug`) y una **lista negra** de subdominios reservados para evitar colisiones.

---

## 70. Orden de migraciones Laravel

```
database/migrations/
├── central/                        ← corren en el schema public (una vez)
│   ├── 0001_create_geo_ubigeos
│   ├── 0002_create_geo_regions
│   ├── 0003_create_geo_zones
│   ├── 0010_create_plans
│   ├── 0011_create_plan_features
│   ├── 0012_create_promo_codes
│   ├── 0013_create_tenants
│   ├── 0014_create_subscriptions
│   ├── 0015_create_subscription_payments
│   ├── 0020_create_tour_categories
│   ├── 0021_create_tour_spots (+ media)
│   ├── 0022_create_tour_events
│   ├── 0023_create_tour_routes (+ stops)
│   ├── 0030_create_pub_restaurants (+ media, hours, highlights, slots)
│   ├── 0040_create_app_customers (+ devices, consents, favorites)
│   ├── 0041_create_rsv_reservations (+ events)
│   ├── 0042_create_app_reviews
│   └── 0050_create_platform_notifications (+ audit_logs)
│
└── tenant/                         ← corren en CADA schema rst_* al provisionar
    ├── 0001_create_users (+ roles, role_user)
    ├── 0002_create_sessions_tokens
    ├── 0010_create_cfg_settings (+ branches, service_hours, closures)
    ├── 0020_create_rst_areas (+ rst_tables)
    ├── 0030_create_menu_categories (+ dishes, variants, modifiers)
    ├── 0040_create_reservations (+ reservation_tables, waiting_list)
    ├── 0050_create_orders (+ items, modifiers, kds_tickets)
    ├── 0060_create_sales (+ items, payments, cash_sessions)
    ├── 0070_create_fel_series (+ documents, items, void_requests)
    ├── 0080_create_inv_suppliers (+ products, stock_movements)
    └── 0090_create_pub_sync_state (+ audit_logs)
```

**Comandos operativos:**

```bash
# Migrar el schema central
php artisan migrate --path=database/migrations/central

# Migrar TODOS los tenants (al desplegar cambios de estructura)
php artisan tenants:migrate            # comando custom que itera tenants y hace SET search_path
```

---

## 71. Índices críticos y rendimiento

| Consulta frecuente | Índice / técnica |
|--------------------|------------------|
| "Restaurantes cercanos" (app) | `pub_restaurants` con **PostGIS GIST** sobre `geog`, o `(latitud, longitud)` + filtro bounding box |
| Listado ordenado por ranking/destacado | `idx_pubrest_ranking (score_ranking DESC)` |
| Disponibilidad por restaurante y fecha | `idx_slots_rest_fecha (restaurant_id, fecha)` |
| Reservas del día (panel restaurante) | `idx_reservations_fecha (fecha, hora)` |
| Comisiones pendientes de facturar | `idx_rsv_comision WHERE comision_estado='pendiente'` |
| Búsqueda de plato/restaurante por nombre | `pg_trgm` + `unaccent` (GIN sobre `nombre`) |
| Reportes de ventas | `idx_sales_fecha`; considerar **particionar** `sales`/`audit_logs` por mes si crece |

**Recomendaciones:**
- Vistas materializadas para el dashboard del restaurante (ventas del día/semana), refrescadas por job.
- Métricas de plataforma (nº tenants activos, reservas concretadas, no-show rate) sobre `public`, no sobre schemas de tenants.
- Connection pooling (**PgBouncer**) en modo `session` por el uso de `search_path`.

---

## 72. Seguridad, roles de BD e inmutabilidad

```sql
-- Rol de aplicación: SIN permiso de UPDATE/DELETE en tablas inmutables
REVOKE UPDATE, DELETE ON public.platform_audit_logs FROM vanpe_app;
REVOKE UPDATE, DELETE ON fel_documents FROM vanpe_app;   -- (en cada schema tenant)
REVOKE UPDATE, DELETE ON payments      FROM vanpe_app;
REVOKE UPDATE, DELETE ON audit_logs    FROM vanpe_app;
REVOKE DELETE          ON inv_stock_movements FROM vanpe_app;
```

**Principios de seguridad:**
- **Aislamiento por schema**: un bug en el `WHERE` no puede filtrar datos de otro restaurante (a diferencia del modelo `tenant_id` compartido).
- **UUID** en toda entidad expuesta en API/URLs → no enumerable.
- **Credenciales de facturación cifradas** (AES-256) en capa de aplicación, nunca en texto plano.
- **Ley N° 29733** (datos personales): `app_customer_consents` registra consentimientos; permitir exportación y borrado del turista.
- **Inmutabilidad financiera/legal**: `fel_documents`, `payments`, `audit_logs`, `platform_audit_logs`, `inv_stock_movements` → solo INSERT.
- **Backups**: `pg_dump --schema=rst_xxx` permite respaldo/restauración por restaurante individual.
- **Rate limiting** en el API del turista y en login de tenants; `login_attempts` opcional por schema.

---

## Resumen de la arquitectura

| Capa | Dónde vive | Quién accede | Aislamiento |
|------|-----------|--------------|-------------|
| Administración / SaaS | `public` (Módulos A, B, F) | Super-admin | — |
| Contenido turístico | `public` (Módulo C) | Admin escribe, turista lee | — |
| Catálogo público de restaurantes | `public` (Módulo D) | Turista lee, job publica | Proyección curada |
| App del turista | `public` (Módulo E) | Turista | Datos de plataforma |
| Operación del restaurante | `rst_<hash>` (por tenant) | Solo ese restaurante | **Fuerte (schema)** |

**El corazón del diseño:** cada restaurante trabaja aislado en su subdominio y su schema ("solo lo suyo, genuino"), y **publica** hacia un catálogo central lo que quiere mostrar. El turista consume ese catálogo agregado con lecturas rápidas, y sus reservas se proyectan de vuelta al restaurante. Así resuelves las dos necesidades opuestas —aislamiento y agregación— sin sacrificar ninguna.

---

*Documento de arquitectura v1.0 — VanPe. Próximo paso sugerido: generar las migraciones Laravel (`central/` y `tenant/`) y el comando `tenants:migrate` a partir de este esquema.*
