<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\HotelRequest;
use App\Http\Requests\Tenant\HotelProfileRequest;
use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Hotel;
use App\Models\Provincia;
use App\Models\Tenant;
use App\Services\Platform\HotelCatalogProvisioner;
use App\Services\Platform\HotelWriter;
use App\Tenancy\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Ficha "Mi hotel" para tenants tipo hotel (subdominio). */
class HotelProfileController extends Controller
{
    public function __construct(
        private readonly HotelWriter $writer,
        private readonly HotelCatalogProvisioner $provisioner,
    ) {}

    public function edit(Request $request): Response
    {
        $tenant = $this->currentTenant();
        $this->authorizeView($request);

        $departamentos = Departamento::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departamento $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return Inertia::render('mi-hotel/index', [
            'hotel' => $this->resolveHotel($tenant)->toAdminArray(),
            'departamentos' => $departamentos,
            'options' => [
                'estados' => Hotel::ESTADOS,
                'tipos_habitacion' => Hotel::TIPOS_HABITACION,
                'clasificaciones' => Hotel::CLASIFICACIONES,
                'servicios' => Hotel::SERVICIOS,
                'medios_pago' => Hotel::MEDIOS_PAGO,
                'sistemas_reserva' => Hotel::SISTEMAS_RESERVA,
                'interes_whatsapp' => Hotel::INTERES_WHATSAPP,
                'redes_sociales' => Hotel::REDES_SOCIALES,
                'herramientas' => Hotel::HERRAMIENTAS,
            ],
            'limits' => [
                'min_photos_to_publish' => HotelRequest::MIN_PHOTOS_TO_PUBLISH,
                'max_gallery' => HotelRequest::MAX_GALLERY,
            ],
            'mapbox_token' => config('services.mapbox.token'),
            'can' => [
                'manage' => (bool) $request->user()?->can('tenant.hotel.manage'),
            ],
        ]);
    }

    public function update(HotelProfileRequest $request): RedirectResponse
    {
        $tenant = $this->currentTenant();
        $hotel = $this->resolveHotel($tenant);

        $this->writer->update($hotel, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.mi_hotel.saved'));
    }

    public function provincias(Request $request): JsonResponse
    {
        $this->currentTenant();
        $this->authorizeView($request);

        $rows = Provincia::query()
            ->where('departamento_id', (int) $request->query('departamento_id'))
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Provincia $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function distritos(Request $request): JsonResponse
    {
        $this->currentTenant();
        $this->authorizeView($request);

        $rows = Distrito::query()
            ->where('provincia_id', (int) $request->query('provincia_id'))
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Distrito $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    private function authorizeView(Request $request): void
    {
        abort_unless((bool) $request->user()?->can('tenant.hotel.manage'), 403);
    }

    private function currentTenant(): Tenant
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null || ! $tenant->isHotel(), 404);

        return $tenant;
    }

    private function resolveHotel(Tenant $tenant): Hotel
    {
        $hotel = $tenant->hotel ?? $this->provisioner->createStubForTenant($tenant);

        return $hotel->fresh(['departamento', 'provincia', 'distrito', 'media']) ?? $hotel;
    }
}
