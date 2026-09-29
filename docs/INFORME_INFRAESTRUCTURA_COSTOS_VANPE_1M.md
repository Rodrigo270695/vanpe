# Informe técnico-económico de infraestructura y operación — VanPe

**Proyección de capacidad y costos para un mínimo de 1.000.000 de usuarios de la aplicación móvil**

| Campo | Detalle |
| --- | --- |
| Producto | VanPe (aplicación turística — Android / iOS) |
| Documento | Informe de infraestructura VPS, seguridad y costos operativos |
| Alcance de proyección a 1 millón | **Solo servidor VPS** (resto: costos actuales / de referencia) |
| Moneda | Soles peruanos (S/) y USD donde aplique |
| Fecha de referencia | Septiembre 2026 |
| Servidor actual (hostname) | rodrigo95 — 161.132.37.209 |

---

## 1. Objetivo del informe

Documentar:

1. El **VPS actual** (capacidad y costo).
2. Las **alternativas de ampliación** disponibles.
3. La **proyección recomendada de VPS** para soportar un mínimo de **1.000.000 de usuarios** de la APK/app VanPe.
4. Los costos y consideraciones de **seguridad**, **consultas SUNAT/RENIEC**, **publicación en tiendas**, **Google Maps** y **WhatsApp Business**.

---

## 2. Título del documento

**Informe técnico-económico de infraestructura y costos operativos de VanPe — proyección a 1.000.000 de usuarios**

---

## 3. VPS actual (situación vigente)

### 3.1. Costo

| Concepto | Valor |
| --- | --- |
| **Costo mensual actual del VPS** | **S/ 1 008,00** |

### 3.2. Detalle técnico observado (servidor en producción)

| Recurso | Estado actual |
| --- | --- |
| Sistema operativo | Ubuntu 22.04.5 LTS (GNU/Linux 5.15.x, x86_64) |
| Almacenamiento (/) | **≈ 314,93 GB** totales — uso ≈ **41,1%** |
| Uso de memoria (RAM) | ≈ **13%** ocupada |
| Carga del sistema (load) | **0,19** (baja) |
| Procesos | ≈ 164 |
| Red | IPv4 pública en servicio |

**Lectura operativa:** con el plan actual el servidor está **holgado** (CPU/RAM/disco con margen). Es adecuado para la etapa actual de operación, pero **no es la meta de capacidad** para 1 millón de usuarios a escala.

---

## 4. Alternativas de VPS evaluadas

| Plan | Almacenamiento | Memoria RAM | Costo mensual (S/) | Rol en la evaluación |
| --- | --- | --- | ---: | --- |
| **A — Actual** | ≈ 315 GB | (plan vigente; uso actual bajo) | **1 008** | Operación actual / etapa temprana |
| **B — Intermedio** | **650 GB NVMe** | **32 GB** | **1 800** | Escalón intermedio / tránsito hacia 1M |
| **C — Alto** | **800 GB NVMe** | **64 GB** | **3 500** | **Recomendado para proyección 1 millón** |

> Nota: los montos B y C corresponden a las cotizaciones indicadas (650 GB / 32 GB a S/ 1 800 y 800 GB / 64 GB a S/ 3 500).

---

## 5. Proyección VPS para mínimo 1.000.000 de usuarios (VanPe)

### 5.1. Criterios de dimensionamiento

Para una app turística (catálogo, fichas, planes, mapas, autenticación, APIs Laravel):

- **1.000.000 de usuarios** no implica 1.000.000 de conexiones simultáneas.
- Se asume un pico típico de uso concurrente del orden de **1%–3%** en horas pico (aprox. **10.000–30.000** sesiones concurrentes en el peor caso razonable), con el resto como usuarios registrados/activos en el mes.
- Carga principal: API (Laravel), base de datos, caché (Redis), colas, medios/imágenes y tráfico de mapas (cliente).
- Buenas prácticas: **CDN** para imágenes, caché de listados, índices DB, rate limiting y monitoreo.

### 5.2. Comparación frente a 1 millón de usuarios

| Plan | ¿Soporta 1.000.000 usuarios? | Comentario |
| --- | --- | --- |
| A — S/ 1 008 (≈ 315 GB) | **No** | Suficiente hoy; insuficiente ante picos, crecimiento de BD/medios y concurrencia de 1M. |
| B — S/ 1 800 (650 GB NVMe + 32 GB RAM) | **Parcial / transición** | Puede servir como paso intermedio con CDN y optimización agresiva; margen estrecho en picos altos. |
| **C — S/ 3 500 (800 GB NVMe + 64 GB RAM)** | **Sí — opción idónea** | RAM y disco adecuados para app + DB + Redis + colas en un nodo robusto, con margen para 1M usuarios. |

### 5.3. Recomendación (proyección 1 millón)

**Plan idóneo: C — 800 GB NVMe + 64 GB RAM — S/ 3 500 mensuales.**

| Concepto | Monto |
| --- | --- |
| VPS recomendado (mensual) | **S/ 3 500** |
| VPS recomendado (anual estimado) | **S/ 42 000** |
| Diferencia vs plan actual (mensual) | **+ S/ 2 492** |

**Condiciones para que el plan C sostenga 1 millón con calidad:**

1. CDN / almacenamiento de objetos para portadas y galerías.
2. Redis (o equivalente) para caché y sesiones.
3. Optimización de consultas y colas para jobs pesados.
4. Backups automatizados y monitoreo (CPU, RAM, disco, latencia API).
5. Si el crecimiento supera 1M o el monitoreo muestra saturación, evaluar arquitectura multi-nodo (API + DB separada).

### 5.4. Resumen ejecutivo VPS

| Escenario | Plan | Costo mensual |
| --- | --- | ---: |
| Operación actual | A | S/ 1 008 |
| Escalón intermedio | B | S/ 1 800 |
| **Proyección 1.000.000 usuarios** | **C (recomendado)** | **S/ 3 500** |

---

## 6. Seguridad actual (postura fuerte)

VanPe opera sobre infraestructura con enfoque de **seguridad reforzada**, alineada a buenas prácticas de producción:

| Área | Medidas / enfoque |
| --- | --- |
| Acceso al servidor | Acceso restringido (SSH), usuario privilegiado controlado, endurecimiento del host |
| Comunicaciones | HTTPS / TLS en endpoints de API y web |
| Aplicación | Autenticación de usuarios, tokens de sesión/API, validación de entradas |
| Datos sensibles | Credenciales fuera del código (variables de entorno), principio de mínimo privilegio |
| Permisos móviles | Ubicación y demás permisos justificados (mapas, distancias, navegación) |
| Tiendas | Cumplimiento de políticas Google Play / App Store (privacidad, datos) |
| Continuidad | Backups y actualización de sistema como proceso operativo |

**Declaración para stakeholders:**  
La plataforma cuenta con una postura de seguridad fuerte en servidor y aplicación, orientada a proteger datos de usuarios, integridad del servicio y continuidad operativa. Se mantiene revisión continua de parches y controles de acceso.

---

## 7. Consultas SUNAT y RENIEC

| Concepto | Detalle | Costo |
| --- | --- | ---: |
| Consultas / servicios SUNAT y RENIEC | Presupuesto anual informado | **S/ 500 / año** |

---

## 8. Publicación de la aplicación (Android e iOS)

| Tienda | Concepto | Costo de referencia | Periodicidad |
| --- | --- | ---: | --- |
| **Google Play (Android)** | Alta de cuenta de desarrollador | **US$ 25** (≈ S/ 90–100) | **Único** |
| **App Store (iOS)** | Apple Developer Program | **US$ 99** (≈ S/ 360–380) | **Anual** |

| Concepto | Estimación anual (aprox.) |
| --- | ---: |
| Android (cuenta ya pagada) | S/ 0 (recurrente) |
| iOS (renovación) | ≈ S/ 360–380 / año |
| **Total tiendas (año típico)** | **≈ S/ 360–380** (+ US$ 25 el primer año de Play si aplica) |

---

## 9. Licencia / uso de Google Maps

| Concepto | Detalle |
| --- | --- |
| Producto | Google Maps Platform (Maps SDK Android / iOS y APIs asociadas) |
| Modelo | Pago por uso (pay-as-you-go) / umbrales gratuitos según SKU |
| APIs adicionales | Geocoding, Directions, Places, etc. pueden generar costo según volumen |

| Ítem | Tratamiento |
| --- | --- |
| Costo Maps | Variable según consumo mensual en Google Cloud Billing |
| Acción recomendada | Presupuestos y alertas en Google Cloud; revisar facturación mensual |
| Nota | Gasto **variable**; no se fija un monto único anual en este informe |

---

## 10. WhatsApp Business

| Modalidad | Costo | Uso en VanPe |
| --- | --- | --- |
| **WhatsApp Business (app)** | Gratuito / sin API de Meta | Atención manual, enlaces de contacto / reserva |
| **WhatsApp Business Platform (API)** | Cobro por mensaje entregado (tarifas Meta) | Automatizaciones y notificaciones |

Si solo se abren chats/wa.me: costo de plataforma ≈ S/ 0.  
Si se usa API oficial: gasto **variable** según volumen y categoría de mensajes.

---

## 11. Consolidado de costos

### 11.1. Fijos / periódicos conocidos

| Rubro | Monto | Periodo |
| --- | ---: | --- |
| VPS actual | S/ 1 008 | Mensual |
| **VPS proyección 1 millón (recomendado)** | **S/ 3 500** | **Mensual** |
| SUNAT + RENIEC | S/ 500 | Anual |
| Google Play | US$ 25 | Único (alta) |
| Apple Developer | US$ 99 | Anual |
| Google Maps | Variable | Mensual |
| WhatsApp Business (app) | ≈ 0 | — |
| WhatsApp API (si se activa) | Variable | Mensual |

### 11.2. Solo proyección solicitada a 1 millón de usuarios

| Ítem proyectado a 1M | Decisión |
| --- | --- |
| **VPS** | **Plan C — 800 GB NVMe + 64 GB RAM — S/ 3 500 / mes** |
| Resto de rubros | Costos actuales / de referencia (sin redimensionar a 1M en este documento) |

---

## 12. Conclusión

1. El VPS actual (**S/ 1 008**, ≈ 315 GB) es **adecuado para la operación presente**.
2. Para un mínimo de **1.000.000 de usuarios** de VanPe, el plan **idóneo** es **800 GB NVMe + 64 GB RAM a S/ 3 500 mensuales**, con CDN y buenas prácticas de caché/DB.
3. El plan de **32 GB / 650 GB a S/ 1 800** queda como **escalón intermedio**, no como meta final a 1 millón.
4. La postura de **seguridad es fuerte** y debe mantenerse con parches, accesos controlados y HTTPS.
5. SUNAT/RENIEC (**S/ 500/año**), tiendas, Maps y WhatsApp completan el mapa de costos; Maps y WhatsApp API son los principales **variables**.

---

## 13. Aprobaciones

| Rol | Nombre | Firma / fecha |
| --- | --- | --- |
| Elaboración técnica | | |
| Revisión infraestructura | | |
| Aprobación gerencia / producto | | |

---

*Documento preparado para uso interno de VanPe — infraestructura y presupuesto operativo.*
