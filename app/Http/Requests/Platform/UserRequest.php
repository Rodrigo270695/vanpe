<?php

namespace App\Http\Requests\Platform;

use App\Models\Permission\Role;
use App\Models\Tenant\User as TenantUser;
use App\Models\User as PlatformUser;
use App\Tenancy\TenantManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación de creación y edición de usuarios (misma regla para ambos).
 *
 * Resuelve por contexto el ámbito (plataforma/tenant), el modelo destino y la
 * autorización. Expone helpers que el controlador reutiliza para persistir.
 */
class UserRequest extends FormRequest
{
    private const GUARD = 'web';

    /** @var array<int, string> */
    public const DOCUMENT_TYPES = ['DNI', 'CE', 'PASSPORT', 'RUC'];

    public function authorize(): bool
    {
        return (bool) $this->user()?->can($this->ability());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $model = $this->userModel();
        $ignoreId = $this->route('user');
        $passwordRequired = $this->isCreating() && ! $this->wantsInvite();

        $roleNames = Role::query()
            ->where('guard_name', self::GUARD)
            ->pluck('name')
            ->all();

        $rules = [
            'document_type' => ['nullable', Rule::in(self::DOCUMENT_TYPES)],
            'document_number' => $this->input('document_type') === 'DNI'
                ? ['required', 'digits:8']
                : ['nullable', 'string', 'max:20'],
            'first_name' => ['required', 'string', 'max:120'],
            'paternal_surname' => ['required', 'string', 'max:120'],
            'maternal_surname' => ['nullable', 'string', 'max:120'],
            'email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique($model, 'email')->ignore($ignoreId),
            ],
            'username' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique($model, 'username')->ignore($ignoreId),
            ],
            'password' => [
                $passwordRequired ? 'required' : 'nullable',
                'confirmed',
                'string',
                'min:8',
            ],
            'roles' => ['array'],
            'roles.*' => ['string', Rule::in($roleNames)],
            'active' => ['boolean'],
        ];

        return $rules;
    }

    public function scope(): string
    {
        return app(TenantManager::class)->check() ? 'tenant' : 'platform';
    }

    public function isTenant(): bool
    {
        return $this->scope() === 'tenant';
    }

    public function isCreating(): bool
    {
        return $this->route('user') === null;
    }

    /**
     * La invitación por correo solo aplica al crear personal de un restaurante.
     */
    public function wantsInvite(): bool
    {
        return $this->isTenant() && $this->isCreating() && $this->boolean('invite');
    }

    /**
     * @return class-string<Model>
     */
    public function userModel(): string
    {
        return $this->isTenant() ? TenantUser::class : PlatformUser::class;
    }

    private function ability(): string
    {
        if ($this->isTenant()) {
            return (string) config('permissions.tenant.manage_ability', 'tenant.users.manage');
        }

        return $this->isCreating() ? 'users.create' : 'users.update';
    }
}
