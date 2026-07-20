<?php

namespace App\Services\Tenant;

/**
 * Proyección futura: reserva en public.rsv_reservations → reservations (tenant).
 *
 * Flujo app (vanpe_db_completo.md §67):
 * 1. Turista crea reserva → INSERT rsv_reservations (pending)
 * 2. Job proyecta al schema del restaurante (source=app, status=pending)
 * 3. Restaurante confirma/rechaza → propaga a public + rsv_reservation_events
 * 4. Al cumplirse → comisión en public
 *
 * Las reservas manuales (manual|phone|walkin) solo viven en el tenant; rsv_id null.
 */
class ReservationProjector
{
    // TODO: implementar cuando exista la app del turista y rsv_reservations.
}
