<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\TourEventRequest;
use App\Models\Departamento;
use App\Models\Tenant;
use App\Models\TourEvent;
use App\Services\Platform\TourEventWriter;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TourEventController extends Controller
{
    public function __construct(
        private readonly TourEventWriter $writer,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorizeManage($request);

        $tenant = $this->currentTenant();

        $events = TourEvent::query()
            ->where('owner_type', TourEvent::OWNER_TENANT)
            ->where('tenant_id', $tenant->id)
            ->with(['departamento:id,name', 'sponsors', 'media'])
            ->orderByDesc('destacado')
            ->orderBy('sort_order')
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn (TourEvent $e): array => $this->serialize($e));

        return Inertia::render('events/index', [
            'events' => $events,
            'departamentos' => Departamento::query()
                ->where('status', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'can' => [
                'create' => true,
                'update' => true,
                'delete' => true,
            ],
            'mapbox_token' => config('services.mapbox.token'),
            'basePath' => '/mis-eventos',
            'pageTitle' => 'Ferias y festividades',
            'pageDescription' => 'Publica ferias, fiestas y celebraciones de tu negocio en la app del turista.',
            'defaultDestacado' => false,
            'breadcrumbMode' => 'tenant',
        ]);
    }

    public function store(TourEventRequest $request): RedirectResponse
    {
        $tenant = $this->currentTenant();
        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);

        $data['owner_type'] = TourEvent::OWNER_TENANT;
        $data['tenant_id'] = $tenant->id;

        $this->writer->create($data, $sponsors);

        return back()->with('success', 'Evento creado.');
    }

    public function update(TourEventRequest $request, TourEvent $tour_event): RedirectResponse
    {
        $this->assertOwned($tour_event);

        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);

        $data['owner_type'] = TourEvent::OWNER_TENANT;
        $data['tenant_id'] = $this->currentTenant()->id;

        $this->writer->update($tour_event, $data, $sponsors);

        return back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Request $request, TourEvent $tour_event): RedirectResponse
    {
        $this->authorizeManage($request);
        $this->assertOwned($tour_event);

        $tour_event->delete();

        return back()->with('success', 'Evento eliminado.');
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless(self::userCanManageEvents($request->user()), 403);
    }

    public static function userCanManageEvents(mixed $user): bool
    {
        if ($user === null) {
            return false;
        }

        return (bool) $user->can('tenant.events.manage')
            || (bool) $user->can('tenant.tour_spot.manage')
            || (bool) $user->can('tenant.publication.manage');
    }

    private function assertOwned(TourEvent $event): void
    {
        $tenant = $this->currentTenant();
        abort_unless(
            $event->owner_type === TourEvent::OWNER_TENANT
            && $event->tenant_id === $tenant->id,
            404,
        );
    }

    private function currentTenant(): Tenant
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        return $tenant;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(TourEvent $e): array
    {
        return [
            'id' => $e->id,
            'titulo' => $e->titulo,
            'slug' => $e->slug,
            'resumen' => $e->resumen,
            'descripcion' => $e->descripcion,
            'portada_url' => $e->portada_url,
            'lugar' => $e->lugar,
            'departamento_id' => $e->departamento_id,
            'provincia_id' => $e->provincia_id,
            'distrito_id' => $e->distrito_id,
            'departamento' => $e->departamento?->name,
            'latitud' => $e->latitud,
            'longitud' => $e->longitud,
            'starts_at' => $e->starts_at?->timezone('America/Lima')->format('Y-m-d\TH:i'),
            'ends_at' => $e->ends_at?->timezone('America/Lima')->format('Y-m-d\TH:i'),
            'estado' => $e->estado,
            'destacado' => $e->destacado,
            'sort_order' => $e->sort_order,
            'owner_type' => $e->owner_type,
            'sponsors' => $e->sponsors->map(fn ($s): array => [
                'nombre' => $s->nombre,
                'tipo' => $s->tipo,
                'logo_url' => $s->logo_url,
                'website' => $s->website,
            ])->values()->all(),
            'media' => $e->media->map(fn ($m): array => [
                'id' => $m->id,
                'url' => $m->url,
                'caption' => $m->caption,
            ])->values()->all(),
        ];
    }
}
