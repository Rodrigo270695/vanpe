<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\PubAvailabilitySlot;
use App\Models\PubRestaurant;
use App\Models\RsvReservation;
use App\Models\RsvReservationEvent;
use App\Services\Tenant\ReservationProjector;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class TouristReservationService
{
    public function __construct(
        private readonly ReservationProjector $projector,
    ) {}

    /**
     * @param  array{
     *     restaurant_id: string,
     *     fecha: string,
     *     hora: string,
     *     num_personas: int,
     *     nombre_contacto: string,
     *     telefono_contacto: string,
     *     notas?: string|null,
     *     slot_id?: string|null
     * }  $data
     */
    public function create(Customer $customer, array $data): RsvReservation
    {
        $restaurant = PubRestaurant::query()
            ->whereKey($data['restaurant_id'])
            ->where('activo', true)
            ->first();

        if ($restaurant === null) {
            throw ValidationException::withMessages([
                'restaurant_id' => 'Restaurante no disponible.',
            ]);
        }

        if (! $restaurant->acepta_reservas) {
            throw ValidationException::withMessages([
                'restaurant_id' => 'Este restaurante no acepta reservas por la app.',
            ]);
        }

        $maxGroup = (int) ($restaurant->capacidad_max_grupo ?: 20);
        if ((int) $data['num_personas'] > $maxGroup) {
            throw ValidationException::withMessages([
                'num_personas' => "Máximo {$maxGroup} personas por reserva.",
            ]);
        }

        $hora = substr((string) $data['hora'], 0, 5);
        $slot = null;

        if (! empty($data['slot_id'])) {
            $slot = PubAvailabilitySlot::query()
                ->whereKey($data['slot_id'])
                ->where('tenant_id', $restaurant->tenant_id)
                ->where('cerrado', false)
                ->first();
        } else {
            $slot = PubAvailabilitySlot::query()
                ->where('tenant_id', $restaurant->tenant_id)
                ->whereDate('fecha', $data['fecha'])
                ->where(function ($q) use ($hora): void {
                    $q->where('hora', $hora)
                        ->orWhere('hora', $hora.':00')
                        ->orWhereRaw("to_char(hora::time, 'HH24:MI') = ?", [$hora]);
                })
                ->where('cerrado', false)
                ->first();
        }

        if ($slot === null) {
            throw ValidationException::withMessages([
                'hora' => 'No hay disponibilidad en esa fecha y hora.',
            ]);
        }

        $disponibles = max(0, (int) $slot->cupos_total - (int) $slot->cupos_ocupados);
        if ($disponibles < 1) {
            throw ValidationException::withMessages([
                'hora' => 'Ese horario ya no tiene cupos.',
            ]);
        }

        $reservation = DB::transaction(function () use ($customer, $restaurant, $slot, $data, $hora): RsvReservation {
            $locked = PubAvailabilitySlot::query()->whereKey($slot->id)->lockForUpdate()->first();
            if ($locked === null) {
                throw new RuntimeException('Slot no encontrado.');
            }

            $disponibles = max(0, (int) $locked->cupos_total - (int) $locked->cupos_ocupados);
            if ($disponibles < 1) {
                throw ValidationException::withMessages([
                    'hora' => 'Ese horario ya no tiene cupos.',
                ]);
            }

            $locked->update([
                'cupos_ocupados' => (int) $locked->cupos_ocupados + 1,
                'updated_at' => now(),
            ]);

            $reservation = RsvReservation::query()->create([
                'codigo' => $this->generateCode(),
                'customer_id' => $customer->id,
                'tenant_id' => $restaurant->tenant_id,
                'restaurant_id' => $restaurant->id,
                'fecha' => $data['fecha'],
                'hora' => $hora.':00',
                'num_personas' => (int) $data['num_personas'],
                'nombre_contacto' => $data['nombre_contacto'],
                'telefono_contacto' => $data['telefono_contacto'],
                'notas' => $data['notas'] ?? null,
                'estado' => RsvReservation::ESTADO_PENDIENTE,
                'slot_id' => $locked->id,
            ]);

            RsvReservationEvent::query()->create([
                'reservation_id' => $reservation->id,
                'estado_anterior' => null,
                'estado_nuevo' => RsvReservation::ESTADO_PENDIENTE,
                'actor_tipo' => 'turista',
                'actor_id' => (string) $customer->id,
                'nota' => 'Reserva creada desde la app',
                'created_at' => now(),
            ]);

            PubRestaurant::query()->whereKey($restaurant->id)->increment('total_reservas');

            return $reservation;
        });

        $this->projector->projectCreate($reservation->fresh(['restaurant']));

        return $reservation->fresh(['restaurant']);
    }

    public function cancel(Customer $customer, RsvReservation $reservation, ?string $motivo = null): RsvReservation
    {
        if ((int) $reservation->customer_id !== (int) $customer->id) {
            abort(403);
        }

        if (! $reservation->isCancelableByCustomer()) {
            throw ValidationException::withMessages([
                'reservation' => 'Esta reserva ya no se puede cancelar.',
            ]);
        }

        $updated = DB::transaction(function () use ($reservation, $customer, $motivo): RsvReservation {
            $prev = $reservation->estado;
            $reservation->update([
                'estado' => RsvReservation::ESTADO_CANCELADA_CLIENTE,
                'cancelada_en' => now(),
                'cancelada_motivo' => $motivo ?: 'Cancelada por el turista',
            ]);

            RsvReservationEvent::query()->create([
                'reservation_id' => $reservation->id,
                'estado_anterior' => $prev,
                'estado_nuevo' => RsvReservation::ESTADO_CANCELADA_CLIENTE,
                'actor_tipo' => 'turista',
                'actor_id' => (string) $customer->id,
                'nota' => $motivo,
                'created_at' => now(),
            ]);

            if ($reservation->slot_id) {
                PubAvailabilitySlot::query()
                    ->whereKey($reservation->slot_id)
                    ->where('cupos_ocupados', '>', 0)
                    ->decrement('cupos_ocupados');
            }

            return $reservation->fresh(['restaurant']);
        });

        $this->projector->projectStatus($updated);

        return $updated;
    }

    private function generateCode(): string
    {
        do {
            $code = 'VP-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        } while (RsvReservation::query()->where('codigo', $code)->exists());

        return $code;
    }
}
