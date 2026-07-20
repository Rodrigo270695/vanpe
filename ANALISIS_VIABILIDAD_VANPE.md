# VanPe — Análisis de Viabilidad y Arquitectura

> Documento de análisis estratégico y técnico elaborado desde 5 perspectivas: análisis de sistemas, desarrollo de software, análisis de datos, arquitectura de datos e ingeniería en marketing social.
>
> **Contexto de mercado:** El nombramiento del nuevo Papa (León XIV, de raíces chiclayanas) ha puesto a Chiclayo y la región Lambayeque en el foco del turismo religioso nacional e internacional. Existe una ventana de oportunidad real pero **temporal**: hay que capturarla rápido y luego consolidar.

---

## 1. Resumen ejecutivo

**La idea es viable**, pero tiene un riesgo estructural clásico de los *marketplaces*: el **problema del huevo y la gallina**. Tu negocio tiene dos lados:

- **Turistas** (demanda) → quieren descubrir, reservar, vivir una buena experiencia.
- **Restaurantes** (oferta y fuente de ingresos) → les das un SaaS de gestión (multi-tenant) a cambio de sus datos y de exponerlos a los turistas.

El acierto de tu modelo es que **no cobras al turista** (fricción cero para adopción) y monetizas al restaurante **entregándole valor real** (un sistema de gestión), no solo cobrándole por aparecer. Eso es mucho más defendible que un simple directorio.

**Veredicto:** Viable con alto potencial, **si** se ejecuta por fases y se resuelve primero la captación de restaurantes (el lado difícil del marketplace). La coyuntura del Papa es el gancho de marketing perfecto para el arranque, pero el negocio debe diseñarse para sobrevivir **después** de que baje la ola.

---

## 2. Análisis de Sistemas — Actores, procesos y alcance

### 2.1 Actores del sistema

| Actor | Rol | App / Interfaz |
|-------|-----|----------------|
| **Turista / Visitante** | Descubre lugares, restaurantes, reserva mesa | App móvil **VanPe** (consumidor) |
| **Restaurante (Tenant)** | Gestiona mesas, carta, reservas, facturación | Panel web SaaS (multi-tenant) |
| **Mesero / Staff** | Opera el día a día del restaurante | Panel web / tablet |
| **Administrador de la plataforma (tú)** | Gestiona tenants, cobros, contenido turístico, métricas | Back-office (super-admin) |
| **Guía / Entidad turística** *(opcional futuro)* | Publica puntos turísticos, eventos, rutas | Panel de contenido |

### 2.2 Flujo del restaurante (SaaS multi-tenant)

```
Registro tenant → Onboarding (datos, carta, mesas, horarios)
      → Gestión diaria: Reservas • Mesas • Pedidos • Cocina (KDS)
      → Facturación (boleta/factura electrónica SUNAT)
      → Reportes: ventas, ocupación, platos top
```

### 2.3 Flujo del turista (App VanPe)

```
Descarga app → (Login opcional / invitado)
      → Explora mapa: centros turísticos + restaurantes cercanos (geolocalización)
      → Ve carta, fotos, precios, valoraciones
      → Reserva mesa (fecha, hora, N° personas)
      → Recibe confirmación → Vive la experiencia → Deja reseña
```

### 2.4 El puente clave

El dato que genera el restaurante en **su** sistema (carta, disponibilidad de mesas, horarios, promociones) es **exactamente** el dato que consume la app del turista. Ese es el corazón de tu arquitectura: **un solo origen de verdad, dos audiencias**.

---

## 3. Modelo de Negocio y Monetización

### 3.1 Tu modelo actual (el que planteas)

Cobras al restaurante por darle el sistema de gestión + exposición a turistas. Correcto, pero **una sola fuente de ingreso es frágil**. Te propongo diversificar en capas:

### 3.2 Fuentes de ingreso recomendadas (múltiples, escalonadas)

| # | Fuente | Modelo | Cuándo activarla |
|---|--------|--------|------------------|
| 1 | **Suscripción SaaS** (planes) | Mensual/anual por tenant (Básico / Pro / Premium) | Desde el inicio |
| 2 | **Comisión por reserva concretada** | % o monto fijo por reserva que llega y consume | Fase 2 |
| 3 | **Destacados / posicionamiento** | El restaurante paga por aparecer arriba o "recomendado" | Fase 2 |
| 4 | **Publicidad de terceros** | Hoteles, taxis, agencias, tiendas de souvenirs | Fase 3 (con tráfico) |
| 5 | **Datos agregados y anonimizados** | Reportes de tendencias turísticas a entidades (municipalidad, gremios) | Fase 3 |
| 6 | **Comisión de facturación / pasarela** | Pequeño fee sobre pagos procesados | Fase 3 |

> **Recomendación fuerte:** Arranca con **Freemium**. Plan básico gratis o muy barato para bajar la barrera de entrada de restaurantes (necesitas volumen de oferta para atraer turistas). Cobra por funciones avanzadas (facturación electrónica, reportes, destacados, más mesas/usuarios).

### 3.3 Por qué el Freemium es clave aquí

Tu activo más valioso al inicio **no es el dinero, es el catálogo de restaurantes**. Sin restaurantes, la app del turista está vacía y no sirve. Regala el sistema de gestión al inicio → llénate de tenants → cuando los turistas lleguen (ola del Papa), los restaurantes ya dependerán de tu sistema → **ahí monetizas**.

---

## 4. Arquitectura de Software (Desarrollo)

### 4.1 Stack actual detectado en tu proyecto

- **Backend:** Laravel 13 (PHP 8.3)
- **Frontend web:** React 19 + Inertia.js + TailwindCSS 4 + Radix UI (shadcn)
- **Auth:** Laravel Fortify (+ passkeys)
- **Build:** Vite 8

Es un stack **moderno y correcto** para el panel SaaS. Falta definir la capa de API para la app móvil y la estrategia multi-tenant.

### 4.2 Componentes a construir

```
┌─────────────────────────────────────────────────────────┐
│                      VanPe Platform                       │
├──────────────────┬──────────────────┬───────────────────┤
│  App Móvil        │  Panel SaaS      │  Back-office       │
│  (Turista)        │  (Restaurante)   │  (Super-admin)     │
│  React Native /   │  Laravel+Inertia │  Laravel+Inertia   │
│  Expo o Flutter   │  (ya iniciado)   │                    │
└────────┬─────────┴────────┬─────────┴─────────┬──────────┘
         │                  │                    │
         │        ┌─────────▼──────────┐         │
         └───────►│   API (Laravel)    │◄────────┘
                  │  REST/JSON + Sanctum│
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │   Base de datos    │
                  │  (Multi-tenant)    │
                  └────────────────────┘
```

### 4.3 Decisión crítica: estrategia Multi-Tenant

Existen 3 enfoques. Mi recomendación según tu etapa:

| Enfoque | Descripción | Pros | Contras | ¿Para VanPe? |
|---------|-------------|------|---------|--------------|
| **Single DB, columna `tenant_id`** | Todos los tenants en las mismas tablas, filtradas por `tenant_id` | Simple, barato, fácil de reportar y agregar datos para turistas | Aislamiento lógico (cuidado con fugas de datos) | ✅ **Recomendado para arranque** |
| **DB por tenant** | Cada restaurante su propia base | Aislamiento fuerte | Complejo, caro, difícil agregar datos globales | ❌ Sobre-ingeniería ahora |
| **Schema por tenant** | Un schema por tenant (Postgres) | Balance | Complejidad media-alta | 🔶 Futuro si escalas mucho |

> **Recomendación:** Usa **single database con `tenant_id`** apoyándote en el paquete [`stancl/tenancy`](https://tenancyforlaravel.com/) o `spatie/laravel-multitenancy`. Esto es *clave* porque tu modelo necesita **leer datos de todos los tenants a la vez** (para mostrarle al turista todos los restaurantes en el mapa). Con "DB por tenant" eso sería una pesadilla. El enfoque de columna `tenant_id` te permite consultas globales triviales.

Este es, técnicamente, el punto más importante del proyecto: **elegiste un modelo donde los datos deben estar aislados por tenant PERO agregados para el turista. Eso empuja fuertemente hacia single-DB.**

### 4.4 App móvil — recomendación

- **Expo / React Native:** reutilizas conocimiento de React (que ya usas en web) y compartes tipos/lógica. Un solo código para Android e iOS. **Recomendado.**
- Alternativa: Flutter (excelente rendimiento, pero otro lenguaje/stack).
- Para el MVP incluso podrías lanzar una **PWA** (web app instalable) y evitar las tiendas al inicio → validas más rápido y sin fricción de aprobación en stores.

### 4.5 Facturación electrónica (Perú / SUNAT)

Esto es **crítico y no trivial** en Perú. No lo construyas desde cero. Intégrate con un **PSE/OSE** o proveedor de facturación electrónica (ej. Nubefact, Facturactiva, APIsPeru, Bsale). Es un diferenciador enorme para captar restaurantes: "te doy gestión + facturación SUNAT lista".

---

## 5. Arquitectura de Datos

### 5.1 Modelo de datos central (simplificado)

```
tenants (restaurantes)
  ├── users (staff del restaurante) [tenant_id]
  ├── tables / mesas               [tenant_id]
  ├── menu_categories              [tenant_id]
  ├── dishes / platos              [tenant_id]
  ├── reservations / reservas      [tenant_id, customer_id]
  ├── orders / pedidos             [tenant_id]
  │     └── order_items
  ├── invoices / facturas          [tenant_id]
  └── reviews / reseñas            [tenant_id, customer_id]

customers (turistas)  ← usuarios de la app, NO son de un tenant
tourist_spots (centros turísticos) ← contenido tuyo (plataforma)
events (eventos, ej. actividades por el Papa)
subscriptions / plans (tu monetización)
```

### 5.2 Principio de diseño clave

- Los **turistas (`customers`) NO pertenecen a un tenant.** Son de la plataforma. Un mismo turista reserva en varios restaurantes. Esto es un error común: no los metas dentro del silo del tenant.
- Los **restaurantes y su operación SÍ están aislados por `tenant_id`.**
- Los **centros turísticos y eventos son contenido de la plataforma** (tú los cargas o los importas de fuentes oficiales / MINCETUR / municipalidad).

### 5.3 Capa analítica (Analista/Arquitecto de datos)

Aquí está una de tus **ventajas competitivas ocultas**. Estás sentado sobre datos valiosísimos:

- Qué platos se piden más y en qué zonas.
- Horas pico de reserva, tasa de no-show.
- Origen de los turistas (si capturas nacionalidad/ciudad).
- Rutas turísticas más frecuentes (spot → restaurante).

**Recomendación de arquitectura de datos:**

1. **OLTP** (transaccional): tu base MySQL/PostgreSQL para la operación diaria.
2. **Capa analítica separada:** replica/ETL hacia un esquema de reportes (o data warehouse ligero) para no cargar la BD operativa con consultas pesadas.
3. **Dashboards:** para el restaurante (sus ventas) y para ti (métricas de plataforma, salud del marketplace).
4. **Datos anonimizados y agregados** → producto vendible a municipalidad/gremios (fuente de ingreso #5). **Nunca vendas datos personales identificables** (ver sección legal).

---

## 6. Marketing Social e Ingeniería de Adopción

### 6.1 La ola del Papa: gancho, no cimiento

El fenómeno León XIV te da **atención gratuita y masiva** ahora. Úsalo para el lanzamiento, pero **el negocio no puede depender de él**. La afluencia religiosa bajará; el modelo debe servir al turismo general de Lambayeque (gastronómico, cultural, playas, arqueología: Sipán, Túcume, Museo Tumbas Reales) todo el año.

### 6.2 Estrategia de arranque del marketplace (resolver el huevo-gallina)

**Prioridad #1: conseguir restaurantes ANTES que turistas.** Un turista abre la app y si está vacía, la desinstala. Un restaurante entra aunque no haya turistas todavía, porque le das un sistema de gestión útil por sí mismo.

Tácticas:

1. **Venta directa "boots on the ground":** visita restaurantes de Chiclayo (empieza por la zona del turismo religioso y gastronómico). Ofrece onboarding gratis.
2. **Ancla con casos emblemáticos:** consigue 5-10 restaurantes conocidos (ej. de la ruta del "seco de cabrito", "arroz con pato", chifas emblemáticos). Su presencia atrae a los demás.
3. **Gratis durante la coyuntura:** "Sistema gratis por 6 meses por el año jubilar del Papa." Genera volumen.
4. **Sello VanPe:** un adhesivo/QR físico en la puerta ("Reserva por VanPe"). Marketing offline que alimenta la app.

### 6.3 Captación de turistas

- SEO + contenido: "Dónde comer en Chiclayo", "Ruta gastronómica del Papa", "Qué hacer en Lambayeque".
- Alianzas con **hoteles, agencias de viaje, aeropuerto, terminales** (QR para descargar la app).
- Redes sociales con contenido de la coyuntura papal + gastronomía.
- Reseñas y gamificación: incentiva al turista a reseñar.

### 6.4 Marketing social (impacto)

Puedes darle un ángulo de **impacto social** que mejora la marca y abre puertas (municipalidad, ONGs, cooperación):

- Impulsar **pymes gastronómicas locales** y formalización (la facturación electrónica ayuda a formalizar).
- Promover turismo **descentralizado** (no solo el centro, también distritos).
- Datos para políticas públicas de turismo.

Esto no es solo bonito: te da **aliados institucionales y prensa gratis**.

---

## 7. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| **Huevo-gallina** (app vacía) | Alto | Captar restaurantes primero; freemium |
| **Dependencia de la ola del Papa** | Alto | Diseñar para turismo general y recurrente |
| **Baja adopción tecnológica de restaurantes** | Medio-Alto | Onboarding asistido, UX simple, capacitación |
| **Complejidad de facturación SUNAT** | Medio | Integrar proveedor OSE/PSE, no construir desde cero |
| **No-shows en reservas** | Medio | Confirmaciones, recordatorios, quizás pequeña garantía |
| **Fuga de datos entre tenants** | Alto | Global scopes por `tenant_id`, tests de aislamiento |
| **Competencia** (otras apps de reservas) | Medio | Tu diferenciador = SaaS de gestión + coyuntura local |
| **Legal: datos personales** | Alto | Cumplir Ley N° 29733 (protección de datos personales, Perú) |
| **Estacionalidad del turismo** | Medio | Ingresos recurrentes por SaaS, no solo por reservas |

---

## 8. Consideraciones Legales (Perú)

- **Ley N° 29733** de Protección de Datos Personales: registro de bancos de datos ante la ANPD, consentimiento, política de privacidad. **Crítico** porque manejas datos de turistas y transacciones.
- **Facturación electrónica SUNAT:** cumplir formato UBL, usar OSE/PSE homologado.
- **Términos y condiciones** claros para ambos lados (turista y tenant).
- Si procesas pagos: cumplir con normas de la pasarela (Culqi, Niubiz, Izipay, Mercado Pago).

---

## 9. Roadmap por Fases (MVP → Escala)

### Fase 0 — Validación (2-4 semanas)
- Entrevistas con 15-20 restaurantes de Chiclayo. ¿Pagarían? ¿Qué necesitan?
- Landing + lista de espera. Medir interés real antes de construir todo.

### Fase 1 — MVP Restaurante (SaaS) (6-10 semanas)
- Multi-tenant (single DB + `tenant_id`).
- Gestión de: carta/platos, mesas, reservas, usuarios del restaurante.
- Panel de reservas y disponibilidad.
- Onboarding de tenant.
- *(Aprovechas tu base Laravel + Inertia + React ya existente.)*

### Fase 2 — App del Turista (MVP) (6-10 semanas)
- API (Laravel Sanctum).
- App (Expo/React Native o PWA): mapa, restaurantes, centros turísticos, reserva de mesa, reseñas.
- Publicación de la disponibilidad de mesas desde el tenant hacia la app.

### Fase 3 — Monetización y facturación (4-8 semanas)
- Planes de suscripción + pasarela de pago.
- Facturación electrónica (integración OSE/PSE).
- Destacados / posicionamiento pagado.

### Fase 4 — Datos y escala
- Dashboards analíticos (restaurante y plataforma).
- Reportes agregados vendibles.
- Publicidad de terceros, expansión a otras ciudades/regiones.

---

## 10. Mejoras y Recomendaciones Clave (resumen accionable)

1. **No dependas de una sola fuente de ingreso.** Combina SaaS + comisión + destacados + publicidad + datos.
2. **Arranca Freemium** para resolver el problema huevo-gallina; el catálogo de restaurantes es tu activo #1.
3. **Multi-tenant en single DB con `tenant_id`** (usa `stancl/tenancy` o `spatie/laravel-multitenancy`). No sobre-ingenieres con DB-por-tenant.
4. **Los turistas son de la plataforma, no de un tenant.** Modela esto bien desde el día 1.
5. **No construyas facturación SUNAT desde cero.** Integra un OSE/PSE.
6. **Construye primero el lado del restaurante** (oferta), luego el del turista (demanda).
7. **PWA o Expo** para móvil, para validar rápido y reutilizar tu stack React.
8. **Diseña para el turismo general de Lambayeque,** no solo para la ola del Papa (que es tu gancho, no tu cimiento).
9. **Cumple la Ley 29733** de datos personales desde el inicio.
10. **Explota tus datos** como producto y como diferenciador competitivo (analítica turística).
11. **Marketing offline (QR/sello VanPe en local)** que retroalimenta lo digital.
12. **Métricas de salud del marketplace desde el día 1:** N° de tenants activos, reservas concretadas, tasa de no-show, DAU/MAU de la app.

---

## 11. Conclusión

**Es una idea viable, oportuna y con un modelo de negocio inteligente** (monetizas al lado que puede pagar, das gratis al lado que necesitas para crecer). Su mayor fortaleza es que le entregas valor real al restaurante (gestión), no solo visibilidad — eso te hace pegajoso y difícil de reemplazar.

Sus mayores riesgos son de **ejecución**, no de concepto: resolver el arranque del marketplace y no quedar atado a la coyuntura del Papa. Si sigues el roadmap por fases, resuelves primero la oferta (restaurantes), diversificas ingresos y tratas la ola papal como acelerador (no como base), tienes un negocio con futuro más allá de la coyuntura.

**Siguiente paso recomendado:** Fase 0 (validación con restaurantes reales) en paralelo con el inicio de la Fase 1 sobre tu base Laravel + React ya montada.

---

*Documento vivo. Recomiendo revisarlo tras la Fase 0 con datos reales de las entrevistas a restaurantes.*
