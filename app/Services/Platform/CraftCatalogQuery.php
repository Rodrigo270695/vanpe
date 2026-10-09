<?php

namespace App\Services\Platform;

use App\Models\Craft;
use App\Models\CraftMedia;
use App\Support\PublicMediaUrl;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/** Artesanos y emprendimientos publicados para la app del turista. */
class CraftCatalogQuery
{
    /**
     * @return LengthAwarePaginator<int, Craft>
     */
    public function list(?string $search = null, int $perPage = 20): LengthAwarePaginator
    {
        $term = $search !== null ? mb_strtolower(trim($search)) : '';

        return $this->published()
            ->when($term !== '', function (Builder $q) use ($term): void {
                $like = '%'.$term.'%';
                $q->where(function (Builder $inner) use ($like): void {
                    $inner->whereRaw('lower(nombre) like ?', [$like])
                        ->orWhereRaw('lower(coalesce(descripcion, \'\')) like ?', [$like])
                        ->orWhereHas('media', fn (Builder $mq) => $mq->whereRaw('lower(coalesce(titulo, \'\')) like ?', [$like]));
                });
            })
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->orderBy('nombre')
            ->paginate($perPage);
    }

    /**
     * @return Builder<Craft>
     */
    public function published(): Builder
    {
        return Craft::query()
            ->where('estado', Craft::ESTADO_PUBLICADO)
            ->with('media');
    }

    public function findBySlug(string $slug): ?Craft
    {
        return $this->published()->where('slug', $slug)->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function toListItem(Craft $craft): array
    {
        $media = $craft->relationLoaded('media') ? $craft->media : $craft->media()->get();
        $prices = $media
            ->pluck('precio')
            ->filter(fn ($precio): bool => $precio !== null)
            ->map(fn ($precio): float => (float) $precio);
        $cover = $craft->imagen_portada_url ?: $media->first()?->url;

        return [
            'id' => $craft->id,
            'slug' => $craft->slug,
            'nombre' => $craft->nombre,
            'resumen' => Str::limit(trim((string) $craft->descripcion), 160),
            'latitud' => $craft->latitud !== null ? (float) $craft->latitud : null,
            'longitud' => $craft->longitud !== null ? (float) $craft->longitud : null,
            'imagen_portada_url' => PublicMediaUrl::make($cover),
            'telefono_contacto' => $craft->telefono_contacto,
            'whatsapp_url' => $this->whatsappUrl($craft->telefono_contacto),
            'precio_desde' => $prices->isNotEmpty() ? $prices->min() : null,
            'precio_hasta' => $prices->isNotEmpty() ? $prices->max() : null,
            'moneda' => 'PEN',
            'productos_count' => $media->count(),
            'rating_promedio' => (float) $craft->rating_promedio,
            'total_resenas' => (int) $craft->total_resenas,
            'destacado' => (bool) $craft->destacado,
            'created_at' => $craft->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetail(Craft $craft): array
    {
        return [
            ...$this->toListItem($craft),
            'descripcion' => $craft->descripcion,
            'redes_sociales' => collect($craft->redes_sociales ?? [])
                ->filter(fn ($row): bool => is_array($row) && filled($row['url'] ?? null))
                ->map(fn (array $row): array => [
                    'red' => (string) ($row['red'] ?? 'web'),
                    'url' => (string) $row['url'],
                ])
                ->values()
                ->all(),
            'media' => $craft->media->map(fn (CraftMedia $item): array => [
                'url' => PublicMediaUrl::make($item->url),
                'titulo' => $item->titulo,
                'precio' => $item->precio !== null ? (float) $item->precio : null,
            ])->values()->all(),
        ];
    }

    /** Enlace de WhatsApp a partir del celular peruano de 9 dígitos. */
    public function whatsappUrl(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if ($digits === '') {
            return null;
        }

        if (strlen($digits) === 9) {
            $digits = '51'.$digits;
        }

        return 'https://wa.me/'.$digits;
    }
}
