<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaitingListRequest extends FormRequest
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
            'cliente_nombre' => ['required', 'string', 'max:120'],
            'cliente_telefono' => ['nullable', 'string', 'max:20'],
            'num_personas' => ['required', 'integer', 'min:1', 'max:99'],
            'notas' => ['nullable', 'string', 'max:200'],
        ];
    }
}
