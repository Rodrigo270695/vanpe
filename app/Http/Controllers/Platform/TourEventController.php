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
            ->with(['departamento:id,name', 'sponsors'])
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
        ]);
    }

    public function store(TourEventRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);
        $data['owner_type'] = TourEvent::OWNER_PLATFORM;

        $this->writer->create($data, $sponsors);

        return back()->with('success', 'Evento creado.');
    }

    public function update(TourEventRequest $request, TourEvent $tour_event): RedirectResponse
    {
        $data = $request->validated();
        $sponsors = $data['sponsors'] ?? [];
        unset($data['sponsors']);

        $this->writer->update($tour_event, $data, $sponsors);

        return back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Request $request, TourEvent $tour_event): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('events.delete'), 403);
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
        ];
    }
}
