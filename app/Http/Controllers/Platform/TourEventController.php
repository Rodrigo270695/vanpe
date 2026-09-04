<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\TourEventRequest;
use App\Models\Departamento;
use App\Models\TourEvent;
use App\Services\Platform\TourEventWriter;
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
        abort_unless((bool) $request->user()?->can('events.view'), 403);

        $events = TourEvent::query()
            ->where('owner_type', TourEvent::OWNER_PLATFORM)
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
                'create' => (bool) $request->user()?->can('events.create'),
                'update' => (bool) $request->user()?->can('events.update'),
                'delete' => (bool) $request->user()?->can('events.delete'),
            ],
            'mapbox_token' => config('services.mapbox.token'),
            'basePath' => '/festividades',
            'pageTitle' => 'Ferias y festividades',
            'pageDescription' => 'Eventos de plataforma visibles en la app (ferias, fiestas, celebraciones).',
            'defaultDestacado' => true,
            'breadcrumbMode' => 'platform',
        ]);
    }

    public function store(TourEventRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);
        $data['owner_type'] = TourEvent::OWNER_PLATFORM;
        $data['tenant_id'] = null;

        $this->writer->create($data, $sponsors);

        return back()->with('success', 'Evento creado.');
    }

    public function update(TourEventRequest $request, TourEvent $tour_event): RedirectResponse
    {
        abort_unless($tour_event->owner_type === TourEvent::OWNER_PLATFORM, 404);

        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);
        $data['owner_type'] = TourEvent::OWNER_PLATFORM;
        $data['tenant_id'] = null;

        $this->writer->update($tour_event, $data, $sponsors);

        return back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Request $request, TourEvent $tour_event): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('events.delete'), 403);
        abort_unless($tour_event->owner_type === TourEvent::OWNER_PLATFORM, 404);
        $tour_event->delete();

        return back()->with('success', 'Evento eliminado.');
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
