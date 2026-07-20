<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigHoursRequest extends FormRequest
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
            'service_hours' => ['required', 'array'],
            'service_hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'service_hours.*.opens_at' => ['required', 'date_format:H:i'],
            'service_hours.*.closes_at' => ['required', 'date_format:H:i'],
            'service_hours.*.active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'service_hours.*.opens_at.date_format' => __('messages.configuracion.hours_invalid'),
            'service_hours.*.closes_at.date_format' => __('messages.configuracion.hours_invalid'),
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $rows = $this->input('service_hours', []);

            if (! is_array($rows)) {
                return;
            }

            foreach ($rows as $index => $row) {
                if (! is_array($row) || ! ($row['active'] ?? false)) {
                    continue;
                }

                $opens = $row['opens_at'] ?? null;
                $closes = $row['closes_at'] ?? null;

                if ($opens === null || $closes === null) {
                    continue;
                }

                if ($opens === $closes) {
                    $validator->errors()->add(
                        "service_hours.{$index}.closes_at",
                        __('messages.configuracion.hours_same_time'),
                    );
                }
            }
        });
    }
}
