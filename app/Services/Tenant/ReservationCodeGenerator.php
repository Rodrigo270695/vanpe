<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Reservation;
use Illuminate\Support\Str;

class ReservationCodeGenerator
{
    public function generate(string $source): string
    {
        $prefix = match ($source) {
            'app' => 'VP',
            'phone' => 'T',
            'walkin' => 'W',
            default => 'M',
        };

        do {
            $code = $prefix.'-'.Str::upper(Str::random(6));
        } while (Reservation::query()->where('code', $code)->exists());

        return $code;
    }
}
