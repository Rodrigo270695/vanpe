<?php

namespace App\Services\Platform;

use App\Models\Hotel;
use App\Support\PublicMediaUrl;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class HotelCatalogQuery
{
    /**
     * @param  list<string>  $servicios
     * @return LengthAwarePaginator<int, Hotel>
     */
    public function list(
        ?int $departamentoId = null,
        ?int $provinciaId = null,
        ?int $distritoId = null,
        ?string $search = null,
        ?string $clasificacion = null,
        array $servicios = [],
        int $perPage = 20,
    ): LengthAwarePaginator {
        $term = $search !== null ? trim($search) : '';
        $servicios = array_values(array_intersect(Hotel::SERVICIOS, $servicios));

        return Hotel::query()
            ->where('estado', Hotel::ESTADO_PUBLICADO)
            ->with(['departamento:id,name', 'provincia:id,name', 'distrito:id,name'])
            ->when($departamentoId, fn (Builder $q) => $q->where('departamento_id', $departamentoId))
            ->when($provinciaId, fn (Builder $q) => $q->where('provincia_id', $provinciaId))
            ->when($distritoId, fn (Builder $q) => $q->where('distrito_id', $distritoId))
            ->when(
                $clasificacion !== null && in_array($clasificacion, Hotel::CLASIFICACIONES, true),
                fn (Builder $q) => $q->where('clasificacion', $clasificacion),
            )
            ->when($servicios !== [], function (Builder $q) use ($servicios): void {
                foreach ($servicios as $servicio) {
                    $q->whereJsonContains('servicios', $servicio);
                }
            })
            ->when($term !== '', function (Builder $q) use ($term): void {
                $like = '%'.$term.'%';
                $q->where(function (Builder $inner) use ($like): void {
                    $inner->where('nombre', 'like', $like)
                        ->orWhere('resumen', 'like', $like)
                        ->orWhere('direccion', 'like', $like)
                        ->orWhereHas('distrito', fn (Builder $dq) => $dq->where('name', 'like', $like));
                });
            })
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->orderBy('nombre')
            ->paginate($perPage);
    }

    public function findBySlug(string $slug): ?Hotel
    {
        return Hotel::query()
            ->where('slug', $slug)
            ->where('estado', Hotel::ESTADO_PUBLICADO)
            ->with([
                'media',
                'departamento:id,name',
                'provincia:id,name',
                'distrito:id,name',
            ])
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function toListItem(Hotel $hotel): array
    {
        return [
            'id' => $hotel->id,
            'slug' => $hotel->slug,
            'nombre' => $hotel->nombre,
            'resumen' => $hotel->resumen,
            'direccion' => $hotel->direccion,
            'latitud' => $hotel->latitud !== null ? (float) $hotel->latitud : null,
            'longitud' => $hotel->longitud !== null ? (float) $hotel->longitud : null,
            'imagen_portada_url' => PublicMediaUrl::make($hotel->imagen_portada_url),
            'clasificacion' => $hotel->clasificacion,
            'estrellas' => $hotel->estrellas(),
            'precio_desde' => $hotel->precio_desde !== null ? (float) $hotel->precio_desde : null,
            'precio_hasta' => $hotel->precio_hasta !== null ? (float) $hotel->precio_hasta : null,
            'moneda' => $hotel->moneda ?? 'PEN',
            'tipos_habitacion' => $hotel->tipos_habitacion ?? [],
            'servicios' => array_slice($hotel->servicios ?? [], 0, 6),
            'rating_promedio' => (float) $hotel->rating_promedio,
            'total_resenas' => (int) $hotel->total_resenas,
            'destacado' => (bool) $hotel->destacado,
            'departamento' => $hotel->departamento?->name,
            'provincia' => $hotel->provincia?->name,
            'distrito' => $hotel->distrito?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetail(Hotel $hotel): array
    {
        return [
            ...$this->toListItem($hotel),
            'descripcion' => $hotel->descripcion,
            'referencia' => $hotel->referencia,
            'telefono_reservas' => $hotel->telefono_reservas,
            'email' => $hotel->email,
            'website' => $hotel->website,
            'check_in' => $hotel->check_in,
            'check_out' => $hotel->check_out,
            'servicios' => $hotel->servicios ?? [],
            'medios_pago' => $hotel->medios_pago ?? [],
            'media' => $hotel->media->map(fn ($m): array => [
                'url' => PublicMediaUrl::make($m->url),
                'caption' => $m->caption,
                'is_cover' => (bool) $m->is_cover,
            ])->values(),
        ];
    }
}
