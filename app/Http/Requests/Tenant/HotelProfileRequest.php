<?php

namespace App\Http\Requests\Tenant;

use App\Http\Requests\Platform\HotelRequest;
use App\Models\Hotel;
use App\Tenancy\TenantManager;

/**
 * Ficha "Mi hotel" del dueño: mismas reglas que plataforma, pero el borrador
 * solo exige el nombre y el destacado lo controla únicamente la plataforma.
 */
class HotelProfileRequest extends HotelRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.hotel.manage');
    }

    protected function currentHotel(): ?Hotel
    {
        return app(TenantManager::class)->tenant()?->hotel;
    }

    protected function requiresFullProfile(): bool
    {
        return $this->input('estado') === Hotel::ESTADO_PUBLICADO;
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $hotel = $this->currentHotel();
        $estado = (string) $this->input('estado', Hotel::ESTADO_BORRADOR);

        if ($estado === Hotel::ESTADO_PUBLICADO
            && $hotel?->estado !== Hotel::ESTADO_PUBLICADO
            && ! $this->user()?->can('tenant.hotel.publish')) {
            $estado = $hotel?->estado ?? Hotel::ESTADO_BORRADOR;
        }

        $this->merge([
            'estado' => $estado,
            'destacado' => (bool) $hotel?->destacado,
        ]);
    }
}
