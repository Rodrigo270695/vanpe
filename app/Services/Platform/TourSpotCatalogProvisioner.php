<?php

namespace App\Services\Platform;

use App\Models\TourSpot;
use App\Models\Tenant;
use App\Support\TenantSlug;

/**
 * Crea la ficha TourSpot borrador ligada a un tenant tipo centro turístico.
 */
class TourSpotCatalogProvisioner
{
    public function createStubForTenant(Tenant $tenant): TourSpot
    {
        if ($tenant->tourSpot()->exists()) {
            return $tenant->tourSpot;
        }

        $slug = $this->uniqueTourSpotSlug($tenant->slug ?: $tenant->nombre_comercial);

        return TourSpot::query()->create([
            'tenant_id' => $tenant->id,
            'nombre' => $tenant->nombre_comercial,
            'slug' => $slug,
            'estado' => TourSpot::ESTADO_BORRADOR,
            'departamento_id' => $tenant->departamento_id,
            'provincia_id' => $tenant->provincia_id,
            'distrito_id' => $tenant->distrito_id,
            'direccion' => $tenant->direccion,
            'latitud' => $tenant->latitud,
            'longitud' => $tenant->longitud,
            'telefono' => $tenant->telefono,
            'email' => $tenant->email_admin,
            'imagen_portada_url' => $tenant->portada_url,
            'moneda' => 'PEN',
            'es_gratuito' => false,
            'requiere_reserva' => false,
            'accesible_movilidad_reducida' => false,
            'destacado' => false,
        ]);
    }

    private function uniqueTourSpotSlug(string $source): string
    {
        $base = TenantSlug::unique($source);
        // TenantSlug ensures tenant slug uniqueness; tour_spots has its own unique slug.
        $slug = $base;
        $i = 1;
        while (TourSpot::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
