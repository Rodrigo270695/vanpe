<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenants.create');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'razon_social' => ['nullable', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:60', 'regex:/^[a-z0-9]([a-z0-9\-]{1,58}[a-z0-9])?$/', 'unique:tenants,slug'],
            'ruc' => ['nullable', 'regex:/^\d{11}$/', 'unique:tenants,ruc'],
            'email_admin' => ['required', 'email', 'max:150', 'unique:tenants,email_admin'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'canal_adquisicion' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string', 'max:4000'],
            'portada' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'photos' => ['nullable', 'array', 'max:8'],
            'photos.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'owner_name' => ['required', 'string', 'max:120'],
            'owner_password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'latitud' => $this->blankToNull('latitud'),
            'longitud' => $this->blankToNull('longitud'),
            'direccion' => $this->blankToNull('direccion'),
            'descripcion' => $this->blankToNull('descripcion'),
        ]);
    }

    private function blankToNull(string $key): mixed
    {
        $value = $this->input($key);

        return $value === '' || $value === null ? null : $value;
    }
}
