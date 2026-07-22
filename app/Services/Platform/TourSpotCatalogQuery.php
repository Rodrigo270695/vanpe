<?php

namespace App\Services\Platform;

use App\Models\TourSpot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TourSpotCatalogQuery
{
    /**
     * @return LengthAwarePaginator<int, TourSpot>
     */
    public function list(
        ?int $departamentoId = null,
        ?string $categorySlug = null,
        int $perPage = 20,
    ): LengthAwarePaginator {
        return TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->when($departamentoId, fn (Builder $q) => $q->where('departamento_id', $departamentoId))
            ->when($categorySlug, function (Builder $q) use ($categorySlug): void {
                $q->whereHas('categories', fn (Builder $cq) => $cq->where('slug', $categorySlug));
            })
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->orderBy('nombre')
            ->paginate($perPage);
    }

    public function findBySlug(string $slug): ?TourSpot
    {
        return TourSpot::query()
            ->where('slug', $slug)
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->with([
                'categories',
                'accessModes',
                'media' => fn ($q) => $q->orderBy('sort_order'),
                'hours' => fn ($q) => $q->orderBy('day_of_week'),
                'departamento:id,name',
                'provincia:id,name',
                'distrito:id,name',
            ])
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function toListItem(TourSpot $spot, ?string $locale = 'es'): array
    {
        $primary = $spot->categories->firstWhere('pivot.is_primary', true)
            ?? $spot->categories->first();

        return [
            'id' => $spot->id,
            'slug' => $spot->slug,
            'nombre' => $spot->nombre,
            'resumen' => $spot->resumen,
            'direccion' => $spot->direccion,
            'latitud' => $spot->latitud !== null ? (float) $spot->latitud : null,
            'longitud' => $spot->longitud !== null ? (float) $spot->longitud : null,
            'imagen_portada_url' => $spot->imagen_portada_url,
            'rating_promedio' => (float) $spot->rating_promedio,
            'total_resenas' => (int) $spot->total_resenas,
            'destacado' => (bool) $spot->destacado,
            'es_gratuito' => (bool) $spot->es_gratuito,
            'departamento' => $spot->departamento?->name,
            'distrito' => $spot->distrito?->name,
            'categoria' => $primary?->labelForLocale($locale),
            'categoria_slug' => $primary?->slug,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetail(TourSpot $spot, ?string $locale = 'es'): array
    {
        return [
            ...$this->toListItem($spot, $locale),
            'descripcion' => $spot->descripcion,
            'referencia' => $spot->referencia,
            'telefono' => $spot->telefono,
            'whatsapp' => $spot->whatsapp,
            'website' => $spot->website,
            'precio_entrada_desde' => $spot->precio_entrada_desde !== null ? (float) $spot->precio_entrada_desde : null,
            'precio_entrada_hasta' => $spot->precio_entrada_hasta !== null ? (float) $spot->precio_entrada_hasta : null,
            'moneda' => $spot->moneda,
            'dificultad_acceso' => $spot->dificultad_acceso,
            'horario_texto' => $spot->horario_texto,
            'tips' => $spot->tips,
            'como_llegar' => $spot->como_llegar,
            'categories' => $spot->categories->map(fn ($c): array => [
                'slug' => $c->slug,
                'name' => $c->labelForLocale($locale),
                'is_primary' => (bool) $c->pivot->is_primary,
            ])->values(),
            'media' => $spot->media->map(fn ($m): array => [
                'url' => $m->url,
                'caption' => $m->caption,
                'is_cover' => $m->is_cover,
            ])->values(),
            'hours' => $spot->hours->map(fn ($h): array => [
                'day_of_week' => $h->day_of_week,
                'active' => (bool) $h->active,
                'opens_at' => $h->opens_at ? substr((string) $h->opens_at, 0, 5) : null,
                'closes_at' => $h->closes_at ? substr((string) $h->closes_at, 0, 5) : null,
            ])->values(),
        ];
    }
}
