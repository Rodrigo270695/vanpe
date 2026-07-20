<?php

namespace App\Http\Requests\Platform;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenants.update');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Tenant $tenant */
        $tenant = $this->route('tenant');

        return [
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'razon_social' => ['required', 'string', 'max:200'],
            'ruc' => [
                'nullable',
                'regex:/^\d{11}$/',
                Rule::unique('tenants', 'ruc')->ignore($tenant->id),
            ],
            'email_admin' => [
                'required',
                'email',
                'max:150',
                Rule::unique('tenants', 'email_admin')->ignore($tenant->id),
            ],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'estado' => ['required', Rule::in(Tenant::STATUSES)],
            'suspension_reason' => [
                Rule::requiredIf(fn () => $this->input('estado') === 'suspended'),
                'nullable',
                'string',
                'max:500',
            ],
            'publicado' => ['boolean'],
            'onboarding_completado' => ['boolean'],
            'onboarding_paso' => ['integer', 'min:0', 'max:5'],
            'canal_adquisicion' => ['nullable', 'string', 'max:50'],
        ];
    }
}
