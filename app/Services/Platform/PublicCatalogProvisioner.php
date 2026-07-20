<?php

namespace App\Services\Platform;

use App\Models\PubRestaurant;
use App\Models\Tenant;

/**
 * Crea la ficha pública vacía del restaurante en el catálogo turista.
 */
class PublicCatalogProvisioner
{
    public function createStubForTenant(Tenant $tenant): PubRestaurant
    {
        if ($tenant->pubRestaurant()->exists()) {
            return $tenant->pubRestaurant;
        }

        return PubRestaurant::query()->create([
            'tenant_id' => $tenant->id,
            'nombre' => $tenant->nombre_comercial,
            'slug' => $tenant->slug,
            'telefono' => $tenant->telefono,
            'direccion' => $tenant->direccion,
            'departamento_id' => $tenant->departamento_id,
            'provincia_id' => $tenant->provincia_id,
            'distrito_id' => $tenant->distrito_id,
            'latitud' => $tenant->latitud,
            'longitud' => $tenant->longitud,
            'logo_url' => $tenant->logo_url,
            'portada_url' => $tenant->portada_url,
            'activo' => false,
        ]);
    }
}
