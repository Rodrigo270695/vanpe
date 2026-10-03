<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** RUC peruano: 11 dígitos, prefijo SUNAT válido y dígito verificador (módulo 11). */
class PeruRuc implements ValidationRule
{
    private const PREFIXES = ['10', '15', '16', '17', '20'];

    private const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $ruc = (string) $value;

        if (! preg_match('/^\d{11}$/', $ruc)) {
            $fail(__('messages.validation_pe.ruc_digits'));

            return;
        }

        if (! in_array(substr($ruc, 0, 2), self::PREFIXES, true)) {
            $fail(__('messages.validation_pe.ruc_prefix'));

            return;
        }

        if (! self::hasValidCheckDigit($ruc)) {
            $fail(__('messages.validation_pe.ruc_check_digit'));
        }
    }

    public static function hasValidCheckDigit(string $ruc): bool
    {
        $sum = 0;
        foreach (self::WEIGHTS as $i => $weight) {
            $sum += ((int) $ruc[$i]) * $weight;
        }

        $check = 11 - ($sum % 11);
        $check = match ($check) {
            10 => 0,
            11 => 1,
            default => $check,
        };

        return $check === (int) $ruc[10];
    }
}
