<?php

namespace App\Services\Tenant;

use App\Models\Tenant\CfgServiceHour;
use Carbon\Carbon;

class ServiceHoursValidator
{
    public function isOpenAt(string $date, string $time): bool
    {
        $dayOfWeek = $this->dayOfWeekFromDate($date);

        $hour = CfgServiceHour::query()
            ->where('day_of_week', $dayOfWeek)
            ->where('active', true)
            ->first();

        if ($hour === null) {
            return false;
        }

        $opens = $this->normalizeTime((string) $hour->opens_at);
        $closes = $this->normalizeTime((string) $hour->closes_at);
        $slot = $this->normalizeTime($time);

        if ($closes > $opens) {
            return $slot >= $opens && $slot <= $closes;
        }

        // Turno nocturno (ej. 18:00 – 02:00)
        return $slot >= $opens || $slot <= $closes;
    }

    private function dayOfWeekFromDate(string $date): int
    {
        return Carbon::parse($date)->dayOfWeekIso - 1;
    }

    private function normalizeTime(string $time): string
    {
        return substr($time, 0, 5);
    }
}
