<?php

namespace App\Support\DateTime;

use Carbon\CarbonInterface;

/**
 * Serializa fechas para el frontend siempre en UTC (ISO-8601),
 * para que Intl.DateTimeFormat aplique correctamente la zona del tenant.
 */
final class ApiDateTime
{
    public static function toUtcIso(?CarbonInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value->copy()->utc()->toIso8601String();
    }
}
