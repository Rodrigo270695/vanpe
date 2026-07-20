<?php

namespace App\Http\Requests\Platform;

use App\Tenancy\TenantManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación de creación y edición de roles (misma regla para ambos).
 *
 * El ámbito (plataforma/tenant) y la autorización se resuelven por contexto.
 */
class RoleRequest extends FormRequest
{
    private const GUARD = 'web';

    public function authorize(): bool
    {
        return (bool) $this->user()?->can($this->ability());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')
                    ->where('guard_name', self::GUARD)
                    ->ignore($roleId),
            ],
        ];
    }

    private function ability(): string
    {
        if (app(TenantManager::class)->check()) {
            return (string) config('permissions.tenant.manage_ability', 'tenant.users.manage');
        }

        // Sin parámetro de ruta 'role' => estamos creando.
        return $this->route('role') === null ? 'roles.create' : 'roles.update';
    }
}
