<?php

namespace App\Services\Platform;

use App\Models\TourEvent;
use App\Support\PublicMediaUrl;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TourEventCatalogQuery
{
    /**
     * @return LengthAwarePaginator<int, TourEvent>
     */
    public function paginate(?int $departamentoId = null, ?string $q = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery($departamentoId, $q)
            ->paginate(min(max($perPage, 1), 50));
    }

    /**
     * @return list<TourEvent>
     */
    public function featured(int $limit = 6): array
    {
        return $this->baseQuery()
            ->orderByDesc('destacado')
            ->orderBy('sort_order')
            ->orderBy('starts_at')
            ->limit($limit)
            ->get()
            ->all();
    }

    public function findPublishedBySlug(string $slug): ?TourEvent
    {
        return TourEvent::query()
            ->published()
            ->with([
                'sponsors',
                'media',
                'departamento:id,name',
                'provincia:id,name',
                'distrito:id,name',
                'tenant.pubRestaurant:id,tenant_id,nombre,slug',
                'tenant.tourSpot:id,tenant_id,nombre,slug',
            ])
            ->where('slug', $slug)
            ->first();
    }

    /**
     * @return Builder<TourEvent>
     */
    private function baseQuery(?int $departamentoId = null, ?string $q = null): Builder
    {
        return TourEvent::query()
            ->published()
            ->activeWindow()
            ->with([
                'departamento:id,name',
                'distrito:id,name',
                'tenant.pubRestaurant:id,tenant_id,nombre,slug',
                'tenant.tourSpot:id,tenant_id,nombre,slug',
            ])
            ->when($departamentoId, fn (Builder $b) => $b->where('departamento_id', $departamentoId))
            ->when($q, function (Builder $b) use ($q): void {
                $term = '%'.mb_strtolower(trim($q)).'%';
                $b->where(function (Builder $inner) use ($term): void {
                    $inner->whereRaw('LOWER(titulo) like ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(lugar, \'\')) like ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(resumen, \'\')) like ?', [$term]);
                });
            })
            ->orderByDesc('destacado')
            ->orderBy('sort_order')
            ->orderBy('starts_at');
    }

    /**
     * @return array<string, mixed>
     */
    public function toListItem(TourEvent $event): array
    {
        return [
            'id' => $event->id,
            'slug' => $event->slug,
            'titulo' => $event->titulo,
            'resumen' => $event->resumen,
            'portada_url' => PublicMediaUrl::make($event->portada_url),
            'lugar' => $event->lugar,
            'starts_at' => $event->starts_at?->timezone('America/Lima')->toIso8601String(),
            'ends_at' => $event->ends_at?->timezone('America/Lima')->toIso8601String(),
            'destacado' => (bool) $event->destacado,
            'owner_type' => $event->owner_type,
            'departamento' => $event->departamento?->name,
            'distrito' => $event->distrito?->name,
            'latitud' => $event->latitud,
            'longitud' => $event->longitud,
            'organizer' => $this->organizerPayload($event),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetail(TourEvent $event): array
    {
        return [
            ...$this->toListItem($event),
            'descripcion' => $event->descripcion,
            'latitud' => $event->latitud,
            'longitud' => $event->longitud,
            'provincia' => $event->provincia?->name,
            'sponsors' => $event->sponsors->map(fn ($s): array => [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'tipo' => $s->tipo,
                'logo_url' => PublicMediaUrl::make($s->logo_url),
                'website' => $s->website,
            ])->values()->all(),
            'media' => $event->media->map(fn ($m): array => [
                'id' => $m->id,
                'url' => PublicMediaUrl::make($m->url),
                'caption' => $m->caption,
                'is_cover' => (bool) $m->is_cover,
            ])->values()->all(),
        ];
    }

    /**
     * @return array{tipo: string, slug: string, nombre: string}|null
     */
    private function organizerPayload(TourEvent $event): ?array
    {
        if ($event->owner_type !== TourEvent::OWNER_TENANT || $event->tenant === null) {
            return null;
        }

        $tenant = $event->tenant;
        $fallbackName = $tenant->nombre_comercial ?: $tenant->razon_social ?: $tenant->slug;

        if ($tenant->isTourSpot()) {
            $spot = $tenant->tourSpot;

            return [
                'tipo' => 'tour_spot',
                'slug' => $spot?->slug ?: $tenant->slug,
                'nombre' => $spot?->nombre ?: $fallbackName,
            ];
        }

        $restaurant = $tenant->pubRestaurant;

        return [
            'tipo' => 'restaurant',
            'slug' => $restaurant?->slug ?: $tenant->slug,
            'nombre' => $restaurant?->nombre ?: $fallbackName,
        ];
    }
}
