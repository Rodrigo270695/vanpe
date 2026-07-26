<?php

namespace App\Services\Tourist;

use App\Models\PubAvailabilitySlot;
use App\Models\RsvReservation;
use App\Models\RsvReservationEvent;
use App\Models\Tenant\Reservation as TenantReservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Espejo tenant → central: cuando el restaurante acepta/rechaza/cancela,
 * actualiza rsv_reservations, cupos y emite evento + push al turista.
 */
class ReservationDecisionSync
{
    /** @var array<string, string> */
    private const STATUS_TO_ESTADO = [
        'pending' => RsvReservation::ESTADO_PENDIENTE,
        'confirmed' => RsvReservation::ESTADO_CONFIRMADA,
        'seated' => RsvReservation::ESTADO_SENTADA,
        'completed' => RsvReservation::ESTADO_CUMPLIDA,
        'no_show' => RsvReservation::ESTADO_NO_SHOW,
        'cancelled_customer' => RsvReservation::ESTADO_CANCELADA_CLIENTE,
        'cancelled_restaurant' => RsvReservation::ESTADO_CANCELADA_RESTAURANTE,
    ];

    public function __construct(
        private readonly ReservationLifecycleNotifier $notifier,
    ) {}

    public function syncFromTenant(TenantReservation $tenantReservation, ?string $actorUserId = null): void
    {
        if (! filled($tenantReservation->rsv_id)) {
            Log::warning('Decisión de reserva sin rsv_id: no se notifica al turista', [
                'tenant_reservation_id' => $tenantReservation->id,
                'tenant_status' => $tenantReservation->status,
            ]);

            return;
        }

        $notifyEstado = null;
        $centralId = null;

        try {
            DB::connection('pgsql')->transaction(function () use ($tenantReservation, $actorUserId, &$notifyEstado, &$centralId): void {
                /** @var RsvReservation|null $central */
                $central = RsvReservation::query()
                    ->whereKey($tenantReservation->rsv_id)
                    ->lockForUpdate()
                    ->first();

                if ($central === null) {
                    Log::warning('Reserva central no encontrada al sincronizar decisión', [
                        'rsv_id' => $tenantReservation->rsv_id,
                        'tenant_status' => $tenantReservation->status,
                    ]);

                    return;
                }

                $nuevo = self::STATUS_TO_ESTADO[$tenantReservation->status] ?? null;
                if ($nuevo === null || $central->estado === $nuevo) {
                    return;
                }

                $prev = $central->estado;
                $payload = ['estado' => $nuevo];

                if ($nuevo === RsvReservation::ESTADO_CONFIRMADA) {
                    $payload['confirmada_en'] = $tenantReservation->confirmed_at ?? now();
                }

                if (in_array($nuevo, [
                    RsvReservation::ESTADO_CANCELADA_RESTAURANTE,
                    RsvReservation::ESTADO_CANCELADA_CLIENTE,
                ], true)) {
                    $payload['cancelada_en'] = $tenantReservation->cancelled_at ?? now();
                    $payload['cancelada_motivo'] = $tenantReservation->cancel_reason;
                }

                $central->update($payload);

                RsvReservationEvent::query()->create([
                    'reservation_id' => $central->id,
                    'estado_anterior' => $prev,
                    'estado_nuevo' => $nuevo,
                    'actor_tipo' => 'restaurante',
                    'actor_id' => $actorUserId,
                    'nota' => $this->noteFor($nuevo),
                    'created_at' => now(),
                ]);

                if ($this->shouldReleaseSlot($prev, $nuevo) && $central->slot_id) {
                    PubAvailabilitySlot::query()
                        ->whereKey($central->slot_id)
                        ->where('cupos_ocupados', '>', 0)
                        ->decrement('cupos_ocupados');
                }

                $notifyEstado = $nuevo;
                $centralId = $central->id;
            });
        } catch (Throwable $e) {
            Log::warning('No se pudo sincronizar decisión de reserva al central', [
                'rsv_id' => $tenantReservation->rsv_id,
                'tenant_status' => $tenantReservation->status,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        // Push fuera de la TX: no bloquear ni revertir el estado por fallos de red.
        if ($notifyEstado === null || $centralId === null) {
            return;
        }

        try {
            $central = RsvReservation::query()
                ->with(['customer', 'restaurant'])
                ->find($centralId);

            if ($central !== null) {
                $this->notifier->notifyTouristDecision($central, $notifyEstado);
            }
        } catch (Throwable $e) {
            Log::warning('Fallo al notificar decisión de reserva al turista', [
                'rsv_id' => $centralId,
                'estado' => $notifyEstado,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function shouldReleaseSlot(string $prev, string $nuevo): bool
    {
        $wasHolding = in_array($prev, [
            RsvReservation::ESTADO_PENDIENTE,
            RsvReservation::ESTADO_CONFIRMADA,
            RsvReservation::ESTADO_SENTADA,
        ], true);

        $releases = in_array($nuevo, [
            RsvReservation::ESTADO_CANCELADA_RESTAURANTE,
            RsvReservation::ESTADO_CANCELADA_CLIENTE,
            RsvReservation::ESTADO_NO_SHOW,
            RsvReservation::ESTADO_CUMPLIDA,
        ], true);

        return $wasHolding && $releases;
    }

    private function noteFor(string $estado): string
    {
        return match ($estado) {
            RsvReservation::ESTADO_CONFIRMADA => 'Restaurante confirmó la reserva',
            RsvReservation::ESTADO_CANCELADA_RESTAURANTE => 'Restaurante rechazó o canceló la reserva',
            RsvReservation::ESTADO_SENTADA => 'Cliente sentado',
            RsvReservation::ESTADO_CUMPLIDA => 'Reserva cumplida',
            RsvReservation::ESTADO_NO_SHOW => 'Marcada como no-show',
            default => 'Estado actualizado por el restaurante',
        };
    }
}
