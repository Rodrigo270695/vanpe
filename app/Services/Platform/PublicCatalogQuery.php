<?php

namespace App\Services\Platform;

use App\Models\PubRestaurant;
use App\Services\Tourist\PublicServiceHoursValidator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/** Consultas de solo lectura sobre el catálogo público (app turista). */
class PublicCatalogQuery
{
    /**
     * Solo fichas activas con tenant vivo y visible en app (publicado).
     *
     * @return Builder<PubRestaurant>
     */
    private function visibleRestaurantsQuery(): Builder
    {
        return PubRestaurant::query()->visibleInApp();
    }

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

        return $this->visibleRestaurantsQuery()
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
        return $this->visibleRestaurantsQuery()
            ->where('slug', $slug)
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
        $restaurant = $this->visibleRestaurantsQuery()
            ->where('slug', $slug)
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

        $slots = $query->limit(200)->get();

        if ($date === null) {
            return $slots;
        }

        return app(PublicServiceHoursValidator::class)
            ->filterSlotsWithinHours((string) $restaurant->tenant_id, $date, $slots);
    }
}
