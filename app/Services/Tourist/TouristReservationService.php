<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\PubAvailabilitySlot;
use App\Models\PubRestaurant;
use App\Models\RsvReservation;
use App\Models\RsvReservationEvent;
use App\Services\Tenant\ReservationProjector;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TouristReservationService
{
    public function __construct(
        private readonly ReservationProjector $projector,
        private readonly PublicServiceHoursValidator $hoursValidator,
        private readonly ReservationLifecycleNotifier $notifier,
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
        $fecha = (string) $data['fecha'];

        $this->assertNotInPast($fecha, $hora);
        $this->assertAnticipation($restaurant, $fecha, $hora);

        if (! $this->hoursValidator->isOpenAt((string) $restaurant->tenant_id, $fecha, $hora)) {
            throw ValidationException::withMessages([
                'hora' => 'Esa hora está fuera del horario de apertura del restaurante.',
            ]);
        }

        $slot = $this->resolveOptionalSlot($restaurant, $data, $fecha, $hora);

        if ($slot !== null) {
            $disponibles = max(0, (int) $slot->cupos_total - (int) $slot->cupos_ocupados);
            if ($disponibles < 1) {
                throw ValidationException::withMessages([
                    'hora' => 'Ese horario ya no tiene cupos.',
                ]);
            }
        }

        $reservation = DB::transaction(function () use ($customer, $restaurant, $slot, $data, $hora, $fecha): RsvReservation {
            $slotId = null;

            if ($slot !== null) {
                $locked = PubAvailabilitySlot::query()->whereKey($slot->id)->lockForUpdate()->first();
                if ($locked === null) {
                    throw ValidationException::withMessages([
                        'hora' => 'No hay disponibilidad en esa fecha y hora.',
                    ]);
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
                $slotId = $locked->id;
            }

            $reservation = RsvReservation::query()->create([
                'codigo' => $this->generateCode(),
                'customer_id' => $customer->id,
                'tenant_id' => $restaurant->tenant_id,
                'restaurant_id' => $restaurant->id,
                'fecha' => $fecha,
                'hora' => $hora.':00',
                'num_personas' => (int) $data['num_personas'],
                'nombre_contacto' => $data['nombre_contacto'],
                'telefono_contacto' => $data['telefono_contacto'],
                'notas' => $data['notas'] ?? null,
                'estado' => RsvReservation::ESTADO_PENDIENTE,
                'slot_id' => $slotId,
            ]);

            RsvReservationEvent::query()->create([
                'reservation_id' => $reservation->id,
                'estado_anterior' => null,
                'estado_nuevo' => RsvReservation::ESTADO_PENDIENTE,
                'actor_tipo' => 'turista',
                'actor_id' => (string) $customer->id,
                'nota' => $slotId
                    ? 'Reserva creada desde la app'
                    : 'Reserva manual solicitada desde la app (sin slot predefinido)',
                'created_at' => now(),
            ]);

            PubRestaurant::query()->whereKey($restaurant->id)->increment('total_reservas');

            return $reservation;
        });

        $this->projector->projectCreate($reservation->fresh(['restaurant']));

        $fresh = $reservation->fresh(['restaurant', 'customer']);
        if ($fresh !== null) {
            $this->notifier->notifyRestaurantNewRequest($fresh);
        }

        return $fresh ?? $reservation;
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

    /**
     * Turista marca llegada al local → estado sentada.
     * Solo desde confirmada y dentro de la ventana de visita.
     *
     * @param  array{lat?: float|null, lng?: float|null}  $coords
     */
    public function markArrived(Customer $customer, RsvReservation $reservation, array $coords = []): RsvReservation
    {
        if ((int) $reservation->customer_id !== (int) $customer->id) {
            abort(403);
        }

        if ($reservation->estado !== RsvReservation::ESTADO_CONFIRMADA) {
            throw ValidationException::withMessages([
                'reservation' => 'Solo puedes marcar llegada en una reserva confirmada.',
            ]);
        }

        if (! $this->isVisitWindowOpen($reservation)) {
            throw ValidationException::withMessages([
                'reservation' => 'Aún no llega la hora de tu reserva. Vuelve cuando sea el momento.',
            ]);
        }

        $this->assertOptionalProximity($reservation, $coords);

        $updated = DB::transaction(function () use ($reservation, $customer): RsvReservation {
            $prev = $reservation->estado;
            $reservation->update([
                'estado' => RsvReservation::ESTADO_SENTADA,
            ]);

            RsvReservationEvent::query()->create([
                'reservation_id' => $reservation->id,
                'estado_anterior' => $prev,
                'estado_nuevo' => RsvReservation::ESTADO_SENTADA,
                'actor_tipo' => 'turista',
                'actor_id' => (string) $customer->id,
                'nota' => 'Turista marcó llegada al local (Ya estoy acá)',
                'created_at' => now(),
            ]);

            return $reservation->fresh(['restaurant']);
        });

        $this->projector->projectStatus($updated);

        return $updated;
    }

    /**
     * Turista termina la visita → estado cumplida.
     * Requiere haber marcado llegada (sentada).
     */
    public function markVisited(Customer $customer, RsvReservation $reservation): RsvReservation
    {
        if ((int) $reservation->customer_id !== (int) $customer->id) {
            abort(403);
        }

        if ($reservation->estado !== RsvReservation::ESTADO_SENTADA) {
            throw ValidationException::withMessages([
                'reservation' => 'Primero marca “Ya estoy acá” al llegar al local.',
            ]);
        }

        if (! $this->isVisitWindowOpen($reservation)) {
            throw ValidationException::withMessages([
                'reservation' => 'La ventana para cerrar la visita ya expiró.',
            ]);
        }

        $updated = DB::transaction(function () use ($reservation, $customer): RsvReservation {
            $prev = $reservation->estado;
            $reservation->update([
                'estado' => RsvReservation::ESTADO_CUMPLIDA,
            ]);

            RsvReservationEvent::query()->create([
                'reservation_id' => $reservation->id,
                'estado_anterior' => $prev,
                'estado_nuevo' => RsvReservation::ESTADO_CUMPLIDA,
                'actor_tipo' => 'turista',
                'actor_id' => (string) $customer->id,
                'nota' => 'Turista terminó la visita',
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

    public function isVisitWindowOpen(RsvReservation $reservation): bool
    {
        $fecha = $reservation->fecha?->toDateString();
        $hora = substr((string) $reservation->hora, 0, 5);
        if ($fecha === null || $hora === '') {
            return false;
        }

        $startsAt = Carbon::parse("{$fecha} {$hora}", 'America/Lima')->subMinutes(15);
        $endsAt = Carbon::parse("{$fecha} {$hora}", 'America/Lima')->addHours(12);

        return now('America/Lima')->betweenIncluded($startsAt, $endsAt);
    }

    /**
     * Si el cliente envía coords y el restaurante tiene ubicación, exige ~300 m.
     *
     * @param  array{lat?: float|null, lng?: float|null}  $coords
     */
    private function assertOptionalProximity(RsvReservation $reservation, array $coords): void
    {
        $lat = isset($coords['lat']) ? (float) $coords['lat'] : null;
        $lng = isset($coords['lng']) ? (float) $coords['lng'] : null;

        if ($lat === null || $lng === null) {
            return;
        }

        $reservation->loadMissing('restaurant');
        $restaurant = $reservation->restaurant;
        if ($restaurant === null || $restaurant->latitud === null || $restaurant->longitud === null) {
            return;
        }

        $distanceM = $this->haversineMeters(
            $lat,
            $lng,
            (float) $restaurant->latitud,
            (float) $restaurant->longitud,
        );

        if ($distanceM > 300) {
            throw ValidationException::withMessages([
                'location' => 'Parece que aún no estás cerca del restaurante. Acércate o marca la llegada desde Mis reservas.',
            ]);
        }
    }

    private function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371000;
        $φ1 = deg2rad($lat1);
        $φ2 = deg2rad($lat2);
        $Δφ = deg2rad($lat2 - $lat1);
        $Δλ = deg2rad($lng2 - $lng1);

        $a = sin($Δφ / 2) ** 2 + cos($φ1) * cos($φ2) * sin($Δλ / 2) ** 2;

        return 2 * $earth * asin(min(1, sqrt($a)));
    }

    public function customerCanReviewRestaurant(Customer $customer, string $restaurantId): bool
    {
        return RsvReservation::query()
            ->where('customer_id', $customer->id)
            ->where('restaurant_id', $restaurantId)
            ->where('estado', RsvReservation::ESTADO_CUMPLIDA)
            ->exists();
    }

    /**
     * @param  array{slot_id?: string|null}  $data
     */
    private function resolveOptionalSlot(
        PubRestaurant $restaurant,
        array $data,
        string $fecha,
        string $hora,
    ): ?PubAvailabilitySlot {
        if (! empty($data['slot_id'])) {
            $slot = PubAvailabilitySlot::query()
                ->whereKey($data['slot_id'])
                ->where('tenant_id', $restaurant->tenant_id)
                ->whereDate('fecha', $fecha)
                ->where('cerrado', false)
                ->first();

            if ($slot === null) {
                throw ValidationException::withMessages([
                    'hora' => 'El turno seleccionado ya no está disponible.',
                ]);
            }

            if (substr((string) $slot->hora, 0, 5) !== $hora) {
                throw ValidationException::withMessages([
                    'hora' => 'El horario seleccionado no coincide con la disponibilidad.',
                ]);
            }

            return $slot;
        }

        return PubAvailabilitySlot::query()
            ->where('tenant_id', $restaurant->tenant_id)
            ->whereDate('fecha', $fecha)
            ->where(function ($q) use ($hora): void {
                $q->where('hora', $hora)
                    ->orWhere('hora', $hora.':00')
                    ->orWhereRaw("to_char(hora::time, 'HH24:MI') = ?", [$hora]);
            })
            ->where('cerrado', false)
            ->first();
    }

    private function assertNotInPast(string $fecha, string $hora): void
    {
        $at = Carbon::parse("{$fecha} {$hora}", 'America/Lima');
        if ($at->lt(now('America/Lima')->subMinute())) {
            throw ValidationException::withMessages([
                'fecha' => 'No puedes reservar en una fecha u hora pasada.',
            ]);
        }
    }

    private function assertAnticipation(PubRestaurant $restaurant, string $fecha, string $hora): void
    {
        $minHours = max(0, (int) ($restaurant->anticipacion_min_horas ?? 0));
        if ($minHours <= 0) {
            return;
        }

        $at = Carbon::parse("{$fecha} {$hora}", 'America/Lima');
        if ($at->lt(now('America/Lima')->addHours($minHours))) {
            throw ValidationException::withMessages([
                'hora' => "Debes reservar con al menos {$minHours} hora(s) de anticipación.",
            ]);
        }
    }

    private function generateCode(): string
    {
        do {
            $code = 'VP-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        } while (RsvReservation::query()->where('codigo', $code)->exists());

        return $code;
    }
}
