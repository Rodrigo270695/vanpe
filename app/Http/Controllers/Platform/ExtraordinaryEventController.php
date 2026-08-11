<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\ExtraordinaryEvent;
use App\Models\ExtraordinaryEventStop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ExtraordinaryEventController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('events.view'), 403);

        $events = ExtraordinaryEvent::query()
            ->with('stops')
            ->orderByDesc('starts_at')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (ExtraordinaryEvent $e): array => $this->serialize($e));

        return Inertia::render('extraordinary-events/index', [
            'events' => $events,
            'can' => [
                'create' => (bool) $request->user()?->can('events.create'),
                'update' => (bool) $request->user()?->can('events.update'),
                'delete' => (bool) $request->user()?->can('events.delete'),
            ],
            'mapbox_token' => config('services.mapbox.token') ?? config('services.mapbox.public_token'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('events.create'), 403);

        $data = $this->validated($request);
        $stops = $this->validatedStops($request);

        DB::transaction(function () use ($request, $data, $stops): void {
            $event = ExtraordinaryEvent::query()->create([
                ...$data,
                'slug' => $this->uniqueSlug($data['titulo']),
                'logo_url' => $this->storeLogo($request),
            ]);
            $this->syncStops($event, $stops);
        });

        return back()->with('success', 'Evento extraordinario creado.');
    }

    public function update(Request $request, ExtraordinaryEvent $extraordinary_event): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('events.update'), 403);

        $data = $this->validated($request);
        $stops = $this->validatedStops($request);

        DB::transaction(function () use ($request, $extraordinary_event, $data, $stops): void {
            $logo = $this->storeLogo($request, $extraordinary_event->logo_url);
            $extraordinary_event->update([
                ...$data,
                'logo_url' => $logo,
            ]);
            $this->syncStops($extraordinary_event, $stops);
        });

        return back()->with('success', 'Evento extraordinario actualizado.');
    }

    public function destroy(Request $request, ExtraordinaryEvent $extraordinary_event): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('events.delete'), 403);
        $extraordinary_event->delete();

        return back()->with('success', 'Evento extraordinario eliminado.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:160'],
            'cta_label' => ['nullable', 'string', 'max:120'],
            'floating_text' => ['nullable', 'string', 'max:180'],
            'descripcion' => ['nullable', 'string', 'max:4000'],
            'year_effect' => ['nullable', 'string', 'max:8'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'logo' => ['nullable', 'image', 'max:5120'],
        ]);

        return [
            'titulo' => $data['titulo'],
            'cta_label' => $data['cta_label'] ?: 'Ver la ruta del papa',
            'floating_text' => $data['floating_text'] ?: null,
            'descripcion' => $data['descripcion'] ?? null,
            'year_effect' => $data['year_effect'] ?: '2026',
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'active' => (bool) ($data['active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function validatedStops(Request $request): array
    {
        $data = $request->validate([
            'stops' => ['nullable', 'array'],
            'stops.*.nombre' => ['required_with:stops', 'string', 'max:200'],
            'stops.*.slug' => ['nullable', 'string', 'max:180'],
            'stops.*.target_type' => ['nullable', 'in:restaurant,tour_spot,custom'],
            'stops.*.target_id' => ['nullable', 'uuid'],
            'stops.*.latitud' => ['required_with:stops', 'numeric', 'between:-90,90'],
            'stops.*.longitud' => ['required_with:stops', 'numeric', 'between:-180,180'],
            'stops.*.visita_at' => ['nullable', 'date'],
            'stops.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        return array_values($data['stops'] ?? []);
    }

    /**
     * @param  list<array<string, mixed>>  $stops
     */
    private function syncStops(ExtraordinaryEvent $event, array $stops): void
    {
        $event->stops()->delete();

        foreach (array_values($stops) as $index => $stop) {
            ExtraordinaryEventStop::query()->create([
                'extraordinary_event_id' => $event->id,
                'nombre' => $stop['nombre'],
                'slug' => $stop['slug'] ?? null,
                'target_type' => $stop['target_type'] ?? 'custom',
                'target_id' => $stop['target_id'] ?? null,
                'latitud' => $stop['latitud'],
                'longitud' => $stop['longitud'],
                'visita_at' => $stop['visita_at'] ?? null,
                'sort_order' => $stop['sort_order'] ?? ($index + 1),
            ]);
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'evento';
        $slug = $base;
        $i = 1;
        while (ExtraordinaryEvent::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    private function storeLogo(Request $request, ?string $current = null): ?string
    {
        if (! $request->hasFile('logo')) {
            return $current;
        }

        $path = $request->file('logo')->store('extraordinary-events', 'public');

        return Storage::disk('public')->url($path);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ExtraordinaryEvent $event): array
    {
        return [
            'id' => $event->id,
            'titulo' => $event->titulo,
            'slug' => $event->slug,
            'cta_label' => $event->cta_label,
            'floating_text' => $event->floating_text,
            'descripcion' => $event->descripcion,
            'logo_url' => $event->logo_url,
            'year_effect' => $event->year_effect,
            'starts_at' => $event->starts_at?->format('Y-m-d\TH:i'),
            'ends_at' => $event->ends_at?->format('Y-m-d\TH:i'),
            'active' => $event->active,
            'sort_order' => $event->sort_order,
            'stops' => $event->stops->map(fn (ExtraordinaryEventStop $s): array => [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'slug' => $s->slug,
                'target_type' => $s->target_type,
                'target_id' => $s->target_id,
                'latitud' => $s->latitud,
                'longitud' => $s->longitud,
                'visita_at' => $s->visita_at?->format('Y-m-d\TH:i'),
                'sort_order' => $s->sort_order,
            ])->values(),
        ];
    }
}
