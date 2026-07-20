<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigReservationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.settings.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reservations_enabled' => ['boolean'],
            'reservation_duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'min_booking_hours_ahead' => ['required', 'integer', 'min:0', 'max:168'],
            'max_booking_days_ahead' => ['required', 'integer', 'min:1', 'max:365'],
            'no_show_tolerance_minutes' => ['required', 'integer', 'min:0', 'max:120'],
        ];
    }
}
