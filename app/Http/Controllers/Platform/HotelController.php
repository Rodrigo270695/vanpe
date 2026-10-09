<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\HotelRequest;
use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Hotel;
use App\Models\Provincia;
use App\Services\Platform\HotelWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Hoteles y hospedajes (solo plataforma). */
class HotelController extends Controller
{
    public function __construct(
        private readonly HotelWriter $writer,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('hotels.view'), 403);

        $hotels = Hotel::query()
            ->with(['departamento', 'provincia', 'distrito', 'media', 'tenant:id,slug,nombre_comercial'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Hotel $hotel): array => $hotel->toAdminArray());

        $departamentos = Departamento::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departamento $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return Inertia::render('hotels/index', [
            'hotels' => $hotels,
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
                'create' => $request->user()?->can('hotels.create'),
                'update' => $request->user()?->can('hotels.update'),
                'delete' => $request->user()?->can('hotels.delete'),
                'publish' => $request->user()?->can('hotels.publish'),
                'support_login' => TenantController::supportAllowed($request->user()),
            ],
        ]);
    }

    public function store(HotelRequest $request): RedirectResponse
    {
        if ($request->input('estado') === Hotel::ESTADO_PUBLICADO) {
            abort_unless((bool) $request->user()?->can('hotels.publish'), 403);
        }

        $this->writer->create($request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.hotels.created'));
    }

    public function update(HotelRequest $request, Hotel $hotel): RedirectResponse
    {
        if ($request->input('estado') === Hotel::ESTADO_PUBLICADO) {
            abort_unless((bool) $request->user()?->can('hotels.publish'), 403);
        }

        $this->writer->update($hotel, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.hotels.updated'));
    }

    public function destroy(Request $request, Hotel $hotel): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('hotels.delete'), 403);

        $hotel->delete();

        return back()->with('success', __('messages.hotels.deleted'));
    }

    public function provincias(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->can('hotels.view'), 403);

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
        abort_unless((bool) $request->user()?->can('hotels.view'), 403);

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
}
