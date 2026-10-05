<?php

namespace App\Services\Platform;

use App\Models\Hotel;
use App\Models\Tenant;
use App\Rules\PeruMobilePhone;
use Illuminate\Support\Str;

/**
 * Crea la ficha Hotel borrador ligada a un tenant tipo hotel.
 */
class HotelCatalogProvisioner
{
    public function createStubForTenant(Tenant $tenant): Hotel
    {
        if ($tenant->hotel()->exists()) {
            return $tenant->hotel;
        }

        $phone = PeruMobilePhone::normalize($tenant->telefono);

        return Hotel::query()->create([
            'tenant_id' => $tenant->id,
            'nombre' => $tenant->nombre_comercial,
            'slug' => $this->uniqueHotelSlug($tenant->slug ?: $tenant->nombre_comercial),
            'ruc' => $tenant->ruc,
            'estado' => Hotel::ESTADO_BORRADOR,
            'departamento_id' => $tenant->departamento_id,
            'provincia_id' => $tenant->provincia_id,
            'distrito_id' => $tenant->distrito_id,
            'direccion' => $tenant->direccion,
            'latitud' => $tenant->latitud,
            'longitud' => $tenant->longitud,
            'telefono_reservas' => preg_match('/^9\d{8}$/', $phone) ? $phone : null,
            'email' => $tenant->email_admin,
            'imagen_portada_url' => $tenant->portada_url,
            'moneda' => 'PEN',
            'clasificacion' => 'sin_categoria',
            'destacado' => false,
        ]);
    }

    private function uniqueHotelSlug(string $source): string
    {
        $base = trim(Str::slug($source), '-') ?: 'hotel';
        $slug = $base;
        $i = 1;

        while (Hotel::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
