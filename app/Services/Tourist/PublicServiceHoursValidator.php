<?php

namespace App\Services\Tourist;

use App\Models\PubRestaurantHour;
use Carbon\Carbon;

/** Valida fecha/hora contra horarios publicados del catálogo (pub_restaurant_hours). */
class PublicServiceHoursValidator
{
    public function isOpenAt(string $tenantId, string $date, string $time): bool
    {
        $dayOfWeek = Carbon::parse($date, 'America/Lima')->dayOfWeekIso - 1;

        $hour = PubRestaurantHour::query()
            ->where('tenant_id', $tenantId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if ($hour === null) {
            return false;
        }

        $opens = $this->normalizeTime((string) $hour->opens_at);
        $closes = $this->normalizeTime((string) $hour->closes_at);
        $slot = $this->normalizeTime($time);

        if ($closes > $opens) {
            return $slot >= $opens && $slot < $closes;
        }

        // Turno nocturno (ej. 18:00 – 02:00)
        return $slot >= $opens || $slot < $closes;
    }

    /**
     * @param  iterable<int, object{hora: mixed}>  $slots
     * @return \Illuminate\Support\Collection<int, object>
     */
    public function filterSlotsWithinHours(string $tenantId, string $date, iterable $slots): \Illuminate\Support\Collection
    {
        return collect($slots)->filter(function ($slot) use ($tenantId, $date): bool {
            $hora = substr((string) $slot->hora, 0, 5);

            return $this->isOpenAt($tenantId, $date, $hora);
        })->values();
    }

    private function normalizeTime(string $time): string
    {
        return substr($time, 0, 5);
    }
}
