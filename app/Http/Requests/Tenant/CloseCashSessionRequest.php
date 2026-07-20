<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class CloseCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.sales.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'monto_cierre' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'notas_cierre' => ['nullable', 'string', 'max:500'],
        ];
    }
}
