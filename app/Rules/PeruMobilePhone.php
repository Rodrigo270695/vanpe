<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Celular peruano: 9 dígitos que empiezan con 9 (sin el prefijo +51). */
class PeruMobilePhone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $phone = (string) $value;

        if (! preg_match('/^\d+$/', $phone)) {
            $fail(__('messages.validation_pe.phone_digits'));

            return;
        }

        if (strlen($phone) !== 9) {
            $fail(__('messages.validation_pe.phone_length'));

            return;
        }

        if ($phone[0] !== '9') {
            $fail(__('messages.validation_pe.phone_prefix'));
        }
    }

    /** Quita espacios, guiones y el prefijo de país (+51 / 0051). */
    public static function normalize(?string $value): string
    {
        $phone = preg_replace('/[\s\-().]/', '', trim((string) $value)) ?? '';
        $phone = ltrim($phone, '+');

        if (strlen($phone) === 13 && str_starts_with($phone, '0051')) {
            $phone = substr($phone, 4);
        } elseif (strlen($phone) === 11 && str_starts_with($phone, '51')) {
            $phone = substr($phone, 2);
        }

        return $phone;
    }
}
