<?php

namespace App\Services\Tourist;

use App\Models\CustomerNotification;
use App\Models\RsvReservation;
use App\Models\Tenant;
use App\Services\Tenant\PushNotificationService;
use App\Tenancy\TenantManager;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Notificaciones del ciclo de vida de una reserva app:
 * - Web Push al staff del restaurante (nueva solicitud)
 * - Expo Push + inbox al turista (confirmada / rechazada / cancelada)
 */
class ReservationLifecycleNotifier
{
    public function __construct(
        private readonly ExpoPushService $expoPush,
        private readonly PushNotificationService $tenantPush,
        private readonly TenantManager $tenants,
    ) {}

    public function notifyRestaurantNewRequest(RsvReservation $reservation): void
    {
        $tenant = Tenant::query()->find($reservation->tenant_id);
        if ($tenant === null) {
            return;
        }

        $reservation->loadMissing('restaurant');
        $hora = substr((string) $reservation->hora, 0, 5);
        $fecha = $reservation->fecha?->format('d/m') ?? '';

        try {
            Log::info('Notificando reserva nueva al restaurante (web push)', [
                'rsv_id' => $reservation->id,
                'tenant_id' => $tenant->id,
                'codigo' => $reservation->codigo,
            ]);

            $this->tenants->runForTenant($tenant, function () use ($reservation, $hora, $fecha): void {
                $this->tenantPush->notifyNewAppReservation([
                    'title' => __('messages.push.reservation_new_title'),
                    'body' => __('messages.push.reservation_new_body', [
                        'name' => $reservation->nombre_contacto,
                        'party' => $reservation->num_personas,
                        'date' => $fecha,
                        'time' => $hora,
                        'code' => $reservation->codigo,
                    ]),
                    'url' => '/reservas',
                    'tag' => "reservation-new-{$reservation->id}",
                ]);
            });
        } catch (Throwable $e) {
            Log::warning('No se pudo notificar reserva nueva al restaurante', [
                'rsv_id' => $reservation->id,
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function notifyTouristDecision(RsvReservation $reservation, string $estado): void
    {
        try {
            $reservation->loadMissing(['customer', 'restaurant']);
            $customer = $reservation->customer;
            if ($customer === null) {
                Log::warning('Push turista omitido: reserva sin customer', [
                    'rsv_id' => $reservation->id,
                    'estado' => $estado,
                ]);

                return;
            }

            $restaurantName = $reservation->restaurant?->nombre ?? 'el restaurante';
            $hora = substr((string) $reservation->hora, 0, 5);

            [$title, $body] = match ($estado) {
                RsvReservation::ESTADO_CONFIRMADA => [
                    'Reserva confirmada',
                    "{$restaurantName} aceptó tu mesa a las {$hora} ({$reservation->codigo}).",
                ],
                RsvReservation::ESTADO_CANCELADA_RESTAURANTE => [
                    'Reserva rechazada',
                    "{$restaurantName} no pudo aceptar tu reserva {$reservation->codigo}.",
                ],
                RsvReservation::ESTADO_CANCELADA_CLIENTE => [
                    'Reserva cancelada',
                    "Cancelaste tu reserva en {$restaurantName} ({$reservation->codigo}).",
                ],
                default => [null, null],
            };

            if ($title === null || $body === null) {
                return;
            }

            $data = [
                'type' => 'reservation_status',
                'reservation_id' => $reservation->id,
                'estado' => $estado,
                'screen' => 'reservations',
            ];

            try {
                CustomerNotification::query()->create([
                    'customer_id' => $customer->id,
                    'type' => 'reservation_status',
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                ]);
            } catch (Throwable $e) {
                Log::warning('No se pudo persistir inbox de notificación turista', [
                    'rsv_id' => $reservation->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $this->expoPush->notifyCustomer($customer, [
                'title' => $title,
                'body' => $body,
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            Log::warning('No se pudo notificar decisión al turista', [
                'rsv_id' => $reservation->id,
                'estado' => $estado,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
