<?php

namespace App\Http\Requests\Tenant;

use App\Http\Requests\Platform\CraftRequest;
use App\Models\Craft;
use App\Tenancy\TenantManager;

/**
 * Ficha "Mi artesanía" del dueño: mismas reglas que plataforma, pero el borrador
 * solo exige el nombre. El estado (publicar/pausar) y el destacado los controla
 * únicamente la plataforma.
 */
class CraftProfileRequest extends CraftRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.craft.manage');
    }

    protected function currentCraft(): ?Craft
    {
        return app(TenantManager::class)->tenant()?->craft;
    }

    protected function requiresFullProfile(): bool
    {
        return $this->input('estado') === Craft::ESTADO_PUBLICADO;
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $craft = $this->currentCraft();

        $this->merge([
            'estado' => $craft?->estado ?? Craft::ESTADO_BORRADOR,
            'destacado' => (bool) $craft?->destacado,
        ]);
    }
}
