<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigProfileRequest extends FormRequest
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
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'razon_social' => ['nullable', 'string', 'max:200'],
            'ruc' => ['nullable', 'string', 'max:11', 'regex:/^[0-9]{11}$/'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'email_admin' => ['nullable', 'email', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:4000'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'provincia_id' => ['nullable', 'integer', 'exists:provincias,id'],
            'distrito_id' => ['nullable', 'integer', 'exists:distritos,id'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
