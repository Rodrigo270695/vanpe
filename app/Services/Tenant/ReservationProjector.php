<?php

namespace App\Services\Tenant;

use App\Models\RsvReservation;
use App\Models\Tenant;
use App\Models\Tenant\Reservation as TenantReservation;
use App\Tenancy\TenantManager;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Proyecta reservas centrales (rsv_*) al schema del restaurante.
 */
class ReservationProjector
{
    /** @var array<string, string> */
    private const STATUS_MAP = [
        RsvReservation::ESTADO_PENDIENTE => 'pending',
        RsvReservation::ESTADO_CONFIRMADA => 'confirmed',
        RsvReservation::ESTADO_SENTADA => 'seated',
        RsvReservation::ESTADO_CUMPLIDA => 'completed',
        RsvReservation::ESTADO_NO_SHOW => 'no_show',
        RsvReservation::ESTADO_CANCELADA_CLIENTE => 'cancelled_customer',
        RsvReservation::ESTADO_CANCELADA_RESTAURANTE => 'cancelled_restaurant',
    ];

    public function __construct(
        private readonly TenantManager $tenants,
    ) {}

    public function projectCreate(RsvReservation $reservation): void
    {
        $tenant = Tenant::query()->find($reservation->tenant_id);
        if ($tenant === null) {
            return;
        }

        try {
            $this->tenants->runForTenant($tenant, function () use ($reservation): void {
                $exists = TenantReservation::query()
                    ->where('rsv_id', $reservation->id)
                    ->exists();

                if ($exists) {
                    return;
                }

                TenantReservation::query()->create([
                    'rsv_id' => $reservation->id,
                    'code' => $reservation->codigo,
                    'customer_name' => $reservation->nombre_contacto,
                    'customer_phone' => $reservation->telefono_contacto,
                    'date' => $reservation->fecha?->toDateString(),
                    'time' => substr((string) $reservation->hora, 0, 8),
                    'party_size' => $reservation->num_personas,
                    'notes' => $reservation->notas,
                    'source' => 'app',
                    'status' => self::STATUS_MAP[$reservation->estado] ?? 'pending',
                ]);
            });
        } catch (Throwable $e) {
            Log::warning('No se pudo proyectar reserva al tenant', [
                'rsv_id' => $reservation->id,
                'tenant_id' => $reservation->tenant_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function projectStatus(RsvReservation $reservation): void
    {
        $tenant = Tenant::query()->find($reservation->tenant_id);
        if ($tenant === null) {
            return;
        }

        $status = self::STATUS_MAP[$reservation->estado] ?? null;
        if ($status === null) {
            return;
        }

        try {
            $this->tenants->runForTenant($tenant, function () use ($reservation, $status): void {
                $row = TenantReservation::query()
                    ->where('rsv_id', $reservation->id)
                    ->first();

                if ($row === null) {
                    return;
                }

                $payload = ['status' => $status];
                if (str_starts_with($status, 'cancelled')) {
                    $payload['cancelled_at'] = $reservation->cancelada_en ?? now();
                    $payload['cancel_reason'] = $reservation->cancelada_motivo;
                }
                if ($status === 'confirmed') {
                    $payload['confirmed_at'] = $reservation->confirmada_en ?? now();
                }

                $row->update($payload);
            });
        } catch (Throwable $e) {
            Log::warning('No se pudo sincronizar estado de reserva al tenant', [
                'rsv_id' => $reservation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
