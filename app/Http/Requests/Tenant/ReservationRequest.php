<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Reservation;
use App\Models\Tenant\RstTable;
use App\Services\Tenant\ServiceHoursValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.reservations.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'date' => [
                'required',
                'date',
                Rule::when($this->isMethod('post'), 'after_or_equal:today'),
            ],
            'time' => ['required', 'date_format:H:i'],
            'party_size' => ['required', 'integer', 'min:1', 'max:99'],
            'notes' => ['nullable', 'string', 'max:300'],
            'source' => ['nullable', 'string', Rule::in(Reservation::SOURCES)],
            'table_ids' => ['nullable', 'array'],
            'table_ids.*' => ['uuid', Rule::exists(RstTable::class, 'id')],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! CfgSetting::ensureDefaults()->reservations_enabled) {
                return;
            }

            $date = $this->input('date');
            $time = $this->input('time');

            if (! is_string($date) || ! is_string($time)) {
                return;
            }

            if (! app(ServiceHoursValidator::class)->isOpenAt($date, $time)) {
                $validator->errors()->add(
                    'time',
                    __('messages.reservas.outside_service_hours'),
                );
            }
        });
    }
}
