<?php

namespace App\Services\Platform;

use App\Models\Craft;
use App\Models\CraftMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CraftWriter
{
    public function __construct(
        private readonly CraftMediaStorage $mediaStorage,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): Craft
    {
        return DB::transaction(function () use ($data, $userId): Craft {
            $payload = $this->normalizePayload($data, null);
            $payload['created_by'] = $userId;
            $payload['updated_by'] = $userId;

            $craft = Craft::query()->create($payload);
            $this->syncMedia($craft, $data);

            return $craft->fresh(['media', 'tenant:id,slug,nombre_comercial']) ?? $craft;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Craft $craft, array $data, ?int $userId = null): Craft
    {
        return DB::transaction(function () use ($craft, $data, $userId): Craft {
            $payload = $this->normalizePayload($data, $craft);
            $payload['updated_by'] = $userId;

            $craft->update($payload);
            $this->syncMedia($craft, $data);

            return $craft->fresh(['media', 'tenant:id,slug,nombre_comercial']) ?? $craft;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePayload(array $data, ?Craft $existing): array
    {
        $slug = trim((string) ($data['slug'] ?? ''));
        if ($slug === '') {
            $slug = $existing?->slug ?? Str::slug((string) $data['nombre']);
        }
        $slug = $this->uniqueSlug($slug, $existing?->id);

        $estado = (string) ($data['estado'] ?? Craft::ESTADO_BORRADOR);
        $publicadoEn = $existing?->publicado_en;
        if ($estado === Craft::ESTADO_PUBLICADO && $publicadoEn === null) {
            $publicadoEn = now();
        }

        return [
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'descripcion' => $data['descripcion'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
            'telefono_contacto' => $data['telefono_contacto'] ?? null,
            'redes_sociales' => $this->normalizeRedes($data['redes_sociales'] ?? []),
            'destacado' => (bool) ($data['destacado'] ?? false),
            'estado' => $estado,
            'publicado_en' => $publicadoEn,
        ];
    }

    /**
     * @param  array<int, mixed>  $rows
     * @return list<array{red: string, url: string}>
     */
    private function normalizeRedes(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $red = (string) ($row['red'] ?? '');
            $url = trim((string) ($row['url'] ?? ''));
            if ($url === '' || ! in_array($red, Craft::REDES_SOCIALES, true)) {
                continue;
            }
            $out[] = ['red' => $red, 'url' => $url];
        }

        return $out;
    }

    /**
     * Las fotos llegan en el orden en que se muestran: las que traen `id`
     * actualizan título/precio; las que traen `file` se suben nuevas.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncMedia(Craft $craft, array $data): void
    {
        $removeIds = array_values(array_unique(array_map('strval', $data['remove_media_ids'] ?? [])));
        if ($removeIds !== []) {
            $toDelete = CraftMedia::query()
                ->where('craft_id', $craft->id)
                ->whereIn('id', $removeIds)
                ->get();

            foreach ($toDelete as $media) {
                $this->mediaStorage->deleteMedia($media);
            }
        }

        $photos = $data['photos'] ?? null;
        if (is_array($photos)) {
            $existing = CraftMedia::query()
                ->where('craft_id', $craft->id)
                ->get()
                ->keyBy('id');

            $sort = 0;
            foreach ($photos as $photo) {
                if (! is_array($photo)) {
                    continue;
                }

                $titulo = filled($photo['titulo'] ?? null) ? (string) $photo['titulo'] : null;
                $precio = $photo['precio'] ?? null;
                $id = (string) ($photo['id'] ?? '');

                if ($id !== '' && $existing->has($id)) {
                    $sort++;
                    $existing->get($id)->update([
                        'titulo' => $titulo,
                        'precio' => $precio,
                        'sort_order' => $sort,
                    ]);

                    continue;
                }

                if (($photo['file'] ?? null) instanceof UploadedFile) {
                    $sort++;
                    $this->mediaStorage->storePhoto($photo['file'], $craft, $sort, $titulo, $precio);
                }
            }
        }

        $cover = CraftMedia::query()
            ->where('craft_id', $craft->id)
            ->orderBy('sort_order')
            ->value('url');

        if ($craft->imagen_portada_url !== $cover) {
            $craft->update(['imagen_portada_url' => $cover]);
        }
    }

    private function uniqueSlug(string $base, ?string $ignoreId = null): string
    {
        $slug = $base !== '' ? $base : 'artesania';
        $candidate = $slug;
        $i = 2;

        while (
            Craft::withTrashed()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $slug.'-'.$i;
            $i++;
        }

        return $candidate;
    }
}
