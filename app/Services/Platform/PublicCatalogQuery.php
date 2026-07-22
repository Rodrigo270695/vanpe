<?php

namespace App\Services\Platform;

use App\Models\PubRestaurant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/** Consultas de solo lectura sobre el catálogo público (app turista). */
class PublicCatalogQuery
{
    /**
     * @return LengthAwarePaginator<int, PubRestaurant>
     */
    public function listRestaurants(
        ?int $departamentoId = null,
        ?string $cuisineSlug = null,
        int $perPage = 20,
        ?string $search = null,
        ?int $provinciaId = null,
        ?int $distritoId = null,
    ): LengthAwarePaginator {
        $term = $search !== null ? trim($search) : '';

        return PubRestaurant::query()
            ->where('activo', true)
            ->when($departamentoId, fn (Builder $q) => $q->where('departamento_id', $departamentoId))
            ->when($provinciaId, fn (Builder $q) => $q->where('provincia_id', $provinciaId))
            ->when($distritoId, fn (Builder $q) => $q->where('distrito_id', $distritoId))
            ->when($cuisineSlug, function (Builder $q) use ($cuisineSlug): void {
                $q->whereJsonContains('tipo_cocina', $cuisineSlug);
            })
            ->when($term !== '', function (Builder $q) use ($term): void {
                $like = '%'.$term.'%';
                $q->where(function (Builder $inner) use ($like): void {
                    $inner->where('nombre', 'like', $like)
                        ->orWhere('direccion', 'like', $like)
                        ->orWhere('descripcion', 'like', $like);
                });
            })
            ->orderByDesc('score_ranking')
            ->orderBy('nombre')
            ->paginate($perPage);
    }

    public function findBySlug(string $slug): ?PubRestaurant
    {
        return PubRestaurant::query()
            ->where('slug', $slug)
            ->where('activo', true)
            ->with([
                'photos' => fn ($q) => $q->orderBy('sort_order'),
                'hours' => fn ($q) => $q->orderBy('day_of_week'),
                'highlights' => fn ($q) => $q->where('activo', true)->orderBy('sort_order'),
                'catalogItems' => fn ($q) => $q->orderBy('catalog_type')->orderBy('sort_order'),
            ])
            ->first();
    }

    /**
     * @return \Illuminate\Support\Collection<int, \App\Models\PubAvailabilitySlot>
     */
    public function availabilityForSlug(string $slug, ?string $date = null): \Illuminate\Support\Collection
    {
        $restaurant = PubRestaurant::query()
            ->where('slug', $slug)
            ->where('activo', true)
            ->first();

        if ($restaurant === null) {
            return collect();
        }

        $query = $restaurant->availabilitySlots()
            ->where('cerrado', false)
            ->orderBy('hora');

        if ($date !== null) {
            $query->whereDate('fecha', $date);
        } else {
            $query->whereDate('fecha', '>=', now()->toDateString());
        }

        return $query->limit(200)->get();
    }
}
