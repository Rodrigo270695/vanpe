<?php

namespace App\Services\Platform;

use App\Models\Distrito;
use App\Models\TourSpot;
use App\Models\TourSpotHour;
use App\Models\TourSpotMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TourSpotWriter
{
    public function __construct(
        private readonly TourSpotMediaStorage $mediaStorage,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): TourSpot
    {
        return DB::transaction(function () use ($data, $userId): TourSpot {
            $payload = $this->normalizePayload($data, null);
            $payload['created_by'] = $userId;
            $payload['updated_by'] = $userId;

            $spot = TourSpot::query()->create($payload);
            $this->syncRelations($spot, $data);
            $this->syncMedia($spot, $data);

            return $spot->fresh([
                'departamento',
                'provincia',
                'distrito',
                'categories',
                'accessModes',
                'inclusions',
                'hours',
                'media',
            ]) ?? $spot;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(TourSpot $spot, array $data, ?int $userId = null): TourSpot
    {
        return DB::transaction(function () use ($spot, $data, $userId): TourSpot {
            $payload = $this->normalizePayload($data, $spot);
            $payload['updated_by'] = $userId;

            $spot->update($payload);
            $this->syncRelations($spot, $data);
            $this->syncMedia($spot, $data);

            return $spot->fresh([
                'departamento',
                'provincia',
                'distrito',
                'categories',
                'accessModes',
                'inclusions',
                'hours',
                'media',
            ]) ?? $spot;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePayload(array $data, ?TourSpot $existing): array
    {
        $distrito = Distrito::query()
            ->with('provincia')
            ->findOrFail($data['distrito_id']);

        $provinciaId = (int) $distrito->provincia_id;
        $departamentoId = (int) $distrito->provincia->departamento_id;

        $slug = trim((string) ($data['slug'] ?? ''));
        if ($slug === '') {
            $slug = Str::slug((string) $data['nombre']);
        }
        $slug = $this->uniqueSlug($slug, $existing?->id);

        $estado = (string) ($data['estado'] ?? TourSpot::ESTADO_BORRADOR);
        $publicadoEn = $existing?->publicado_en;
        if ($estado === TourSpot::ESTADO_PUBLICADO && $publicadoEn === null) {
            $publicadoEn = now();
        }

        $tips = $data['tips'] ?? null;
        if (is_array($tips) && array_is_list($tips)) {
            $tips = ['es' => array_values(array_filter(array_map('strval', $tips)))];
        }

        $coverUrl = $data['imagen_portada_url'] ?? $existing?->imagen_portada_url;
        if (! empty($data['remove_cover'])) {
            if ($existing?->imagen_portada_url) {
                $this->mediaStorage->deleteIfExists($existing->imagen_portada_url);
            }
            $coverUrl = null;
        }

        return [
            'departamento_id' => $departamentoId,
            'provincia_id' => $provinciaId,
            'distrito_id' => (int) $distrito->id,
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'resumen' => $data['resumen'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'referencia' => $data['referencia'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? null,
            'website' => $data['website'] ?? null,
            'email' => $data['email'] ?? null,
            'es_gratuito' => (bool) ($data['es_gratuito'] ?? false),
            'precio_entrada_desde' => $data['precio_entrada_desde'] ?? null,
            'precio_entrada_hasta' => $data['precio_entrada_hasta'] ?? null,
            'moneda' => $data['moneda'] ?? 'PEN',
            'requiere_reserva' => (bool) ($data['requiere_reserva'] ?? false),
            'dificultad_acceso' => $data['dificultad_acceso'] ?? 'facil',
            'vialidad_principal' => $data['vialidad_principal'] ?? null,
            'tiempo_acceso_min' => $data['tiempo_acceso_min'] ?? null,
            'distancia_acceso_km' => $data['distancia_acceso_km'] ?? null,
            'acceso_notas' => $data['acceso_notas'] ?? null,
            'estacionamiento' => $data['estacionamiento'] ?? 'desconocido',
            'accesible_movilidad_reducida' => array_key_exists('accesible_movilidad_reducida', $data)
                ? $data['accesible_movilidad_reducida']
                : null,
            'mejor_epoca' => $data['mejor_epoca'] ?? null,
            'duracion_visita_min' => $data['duracion_visita_min'] ?? null,
            'horario_texto' => $data['horario_texto'] ?? null,
            'tips' => $tips,
            'imagen_portada_url' => $coverUrl,
            'destacado' => (bool) ($data['destacado'] ?? false),
            'estado' => $estado,
            'publicado_en' => $publicadoEn,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncRelations(TourSpot $spot, array $data): void
    {
        $categoryIds = array_values(array_unique(array_map('strval', $data['category_ids'] ?? [])));
        $primaryId = isset($data['primary_category_id']) && $data['primary_category_id'] !== ''
            ? (string) $data['primary_category_id']
            : ($categoryIds[0] ?? null);

        if ($primaryId !== null && ! in_array($primaryId, $categoryIds, true)) {
            $categoryIds[] = $primaryId;
        }

        $categorySync = [];
        foreach ($categoryIds as $categoryId) {
            $categorySync[$categoryId] = [
                'is_primary' => $primaryId !== null && $categoryId === $primaryId,
            ];
        }
        $spot->categories()->sync($categorySync);

        $accessIds = array_values(array_unique(array_map('strval', $data['access_mode_ids'] ?? [])));
        $accessSync = [];
        foreach ($accessIds as $index => $accessId) {
            $accessSync[$accessId] = [
                'recomendado' => $index === 0,
                'notas' => null,
            ];
        }
        $spot->accessModes()->sync($accessSync);

        $inclusionIds = array_values(array_unique(array_map('strval', $data['inclusion_ids'] ?? [])));
        $spot->inclusions()->sync($inclusionIds);

        if (isset($data['hours']) && is_array($data['hours'])) {
            TourSpotHour::syncForSpot($spot, $data['hours']);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncMedia(TourSpot $spot, array $data): void
    {
        if (! empty($data['cover']) && $data['cover'] instanceof UploadedFile) {
            $url = $this->mediaStorage->storeCover($data['cover'], $spot);
            $spot->update(['imagen_portada_url' => $url]);
        }

        $removeIds = array_values(array_unique(array_map('strval', $data['remove_media_ids'] ?? [])));
        if ($removeIds !== []) {
            $toDelete = TourSpotMedia::query()
                ->where('tour_spot_id', $spot->id)
                ->whereIn('id', $removeIds)
                ->get();

            foreach ($toDelete as $media) {
                $this->mediaStorage->deleteMedia($media);
            }
        }

        $gallery = $data['gallery'] ?? [];
        if (! is_array($gallery)) {
            return;
        }

        $nextSort = (int) TourSpotMedia::query()
            ->where('tour_spot_id', $spot->id)
            ->max('sort_order');

        foreach ($gallery as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }
            $nextSort++;
            $this->mediaStorage->storeGalleryItem($file, $spot, $nextSort);
        }
    }

    private function uniqueSlug(string $base, ?string $ignoreId = null): string
    {
        $slug = $base !== '' ? $base : 'centro';
        $candidate = $slug;
        $i = 2;

        while (
            TourSpot::withTrashed()
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
