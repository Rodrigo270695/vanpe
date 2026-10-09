<?php

namespace App\Services\Platform;

use App\Models\Craft;
use App\Models\Tenant;
use App\Rules\PeruMobilePhone;
use Illuminate\Support\Str;

/**
 * Crea la ficha de artesanía borrador ligada a un tenant tipo artesanía.
 */
class CraftCatalogProvisioner
{
    public function createStubForTenant(Tenant $tenant): Craft
    {
        if ($tenant->craft()->exists()) {
            return $tenant->craft;
        }

        $phone = PeruMobilePhone::normalize($tenant->telefono);

        return Craft::query()->create([
            'tenant_id' => $tenant->id,
            'nombre' => $tenant->nombre_comercial,
            'slug' => $this->uniqueSlug($tenant->slug ?: $tenant->nombre_comercial),
            'descripcion' => $tenant->descripcion,
            'latitud' => $tenant->latitud,
            'longitud' => $tenant->longitud,
            'telefono_contacto' => preg_match('/^9\d{8}$/', $phone) ? $phone : null,
            'redes_sociales' => [],
            'estado' => Craft::ESTADO_BORRADOR,
            'destacado' => false,
        ]);
    }

    private function uniqueSlug(string $source): string
    {
        $base = trim(Str::slug($source), '-') ?: 'artesania';
        $slug = $base;
        $i = 1;

        while (Craft::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
