<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Reservation;
use App\Models\Tenant\RstTable;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ReservationWorkflow
{
    /**
     * @param  list<string>  $tableIds
     */
    public function syncTables(Reservation $reservation, array $tableIds): void
    {
        $previous = $reservation->tables()->pluck('id')->all();
        $removed = array_diff($previous, $tableIds);

        if ($removed !== []) {
            RstTable::query()
                ->whereIn('id', $removed)
                ->whereIn('status', ['reserved', 'occupied'])
                ->update(['status' => 'free']);
        }

        $reservation->tables()->sync($tableIds);

        if ($tableIds === []) {
            return;
        }

        if ($reservation->status === 'confirmed') {
            RstTable::query()->whereIn('id', $tableIds)->update(['status' => 'reserved']);
        }

        if ($reservation->status === 'seated') {
            RstTable::query()->whereIn('id', $tableIds)->update(['status' => 'occupied']);
        }
    }

    public function confirm(Reservation $reservation): void
    {
        $this->assertStatus($reservation, ['pending']);

        $reservation->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        $tableIds = $reservation->tables()->pluck('id')->all();
        if ($tableIds !== []) {
            RstTable::query()->whereIn('id', $tableIds)->update(['status' => 'reserved']);
        }
    }

    public function reject(Reservation $reservation, ?string $reason = null): void
    {
        $this->assertStatus($reservation, ['pending']);

        $this->releaseTables($reservation);

        $reservation->update([
            'status' => 'cancelled_restaurant',
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);
    }

    public function seat(Reservation $reservation): void
    {
        $this->assertStatus($reservation, ['confirmed']);

        $reservation->update([
            'status' => 'seated',
            'seated_at' => now(),
        ]);

        $tableIds = $reservation->tables()->pluck('id')->all();
        if ($tableIds !== []) {
            RstTable::query()->whereIn('id', $tableIds)->update(['status' => 'occupied']);
        }
    }

    public function complete(Reservation $reservation): void
    {
        $this->assertStatus($reservation, ['seated']);

        $this->releaseTables($reservation);

        $reservation->update(['status' => 'completed']);
    }

    public function markNoShow(Reservation $reservation): void
    {
        $this->assertStatus($reservation, ['confirmed']);

        $this->releaseTables($reservation);

        $reservation->update(['status' => 'no_show']);
    }

    public function cancel(Reservation $reservation, string $by = 'restaurant', ?string $reason = null): void
    {
        $this->assertStatus($reservation, ['pending', 'confirmed']);

        $this->releaseTables($reservation);

        $reservation->update([
            'status' => $by === 'customer' ? 'cancelled_customer' : 'cancelled_restaurant',
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);
    }

    private function releaseTables(Reservation $reservation): void
    {
        $tableIds = $reservation->tables()->pluck('id')->all();

        if ($tableIds === []) {
            return;
        }

        RstTable::query()
            ->whereIn('id', $tableIds)
            ->whereIn('status', ['reserved', 'occupied'])
            ->update(['status' => 'free']);
    }

    /**
     * @param  list<string>  $allowed
     */
    private function assertStatus(Reservation $reservation, array $allowed): void
    {
        if (! in_array($reservation->status, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => __('messages.reservas.invalid_transition'),
            ]);
        }
    }

    public static function formatTime(mixed $time): string
    {
        if ($time instanceof Carbon) {
            return $time->format('H:i');
        }

        return substr((string) $time, 0, 5);
    }
}
