<?php

namespace App\Services\Platform;

use App\Models\Distrito;
use App\Models\Hotel;
use App\Models\HotelMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HotelWriter
{
    public function __construct(
        private readonly HotelMediaStorage $mediaStorage,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): Hotel
    {
        return DB::transaction(function () use ($data, $userId): Hotel {
            $payload = $this->normalizePayload($data, null);
            $payload['created_by'] = $userId;
            $payload['updated_by'] = $userId;

            $hotel = Hotel::query()->create($payload);
            $this->syncMedia($hotel, $data);

            return $hotel->fresh(['departamento', 'provincia', 'distrito', 'media']) ?? $hotel;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Hotel $hotel, array $data, ?int $userId = null): Hotel
    {
        return DB::transaction(function () use ($hotel, $data, $userId): Hotel {
            $payload = $this->normalizePayload($data, $hotel);
            $payload['updated_by'] = $userId;

            $hotel->update($payload);
            $this->syncMedia($hotel, $data);

            return $hotel->fresh(['departamento', 'provincia', 'distrito', 'media']) ?? $hotel;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePayload(array $data, ?Hotel $existing): array
    {
        $distritoId = $data['distrito_id'] ?? null;
        $provinciaId = $data['provincia_id'] ?? null;
        $departamentoId = $data['departamento_id'] ?? null;

        if (filled($distritoId)) {
            $distrito = Distrito::query()->with('provincia')->findOrFail($distritoId);
            $distritoId = (int) $distrito->id;
            $provinciaId = (int) $distrito->provincia_id;
            $departamentoId = (int) $distrito->provincia->departamento_id;
        } else {
            $distritoId = null;
            $provinciaId = filled($provinciaId) ? (int) $provinciaId : null;
            $departamentoId = filled($departamentoId) ? (int) $departamentoId : null;
        }

        $slug = trim((string) ($data['slug'] ?? ''));
        if ($slug === '') {
            $slug = Str::slug((string) $data['nombre']);
        }
        $slug = $this->uniqueSlug($slug, $existing?->id);

        $estado = (string) ($data['estado'] ?? Hotel::ESTADO_BORRADOR);
        $publicadoEn = $existing?->publicado_en;
        if ($estado === Hotel::ESTADO_PUBLICADO && $publicadoEn === null) {
            $publicadoEn = now();
        }

        $coverUrl = $existing?->imagen_portada_url;
        if (! empty($data['remove_cover'])) {
            $this->mediaStorage->deleteIfExists($coverUrl);
            $coverUrl = null;
        }

        return [
            'departamento_id' => $departamentoId,
            'provincia_id' => $provinciaId,
            'distrito_id' => $distritoId,
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'ruc' => $data['ruc'] ?? null,
            'resumen' => $data['resumen'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'referencia' => $data['referencia'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
            'telefono_reservas' => $data['telefono_reservas'] ?? null,
            'email' => $data['email'] ?? null,
            'website' => $data['website'] ?? null,
            'check_in' => $data['check_in'] ?? null,
            'check_out' => $data['check_out'] ?? null,
            'tipos_habitacion' => $this->onlyAllowed($data['tipos_habitacion'] ?? [], Hotel::TIPOS_HABITACION),
            'precio_desde' => $data['precio_desde'] ?? null,
            'precio_hasta' => $data['precio_hasta'] ?? null,
            'moneda' => $data['moneda'] ?? 'PEN',
            'clasificacion' => $data['clasificacion'] ?? 'sin_categoria',
            'servicios' => $this->onlyAllowed($data['servicios'] ?? [], Hotel::SERVICIOS),
            'medios_pago' => $this->onlyAllowed($data['medios_pago'] ?? [], Hotel::MEDIOS_PAGO),
            'imagen_portada_url' => $coverUrl,
            'sistema_reservas' => $data['sistema_reservas'] ?? null,
            'interes_whatsapp' => $data['interes_whatsapp'] ?? null,
            'redes_sociales' => $this->onlyAllowed($data['redes_sociales'] ?? [], Hotel::REDES_SOCIALES),
            'herramientas_interes' => $this->onlyAllowed($data['herramientas_interes'] ?? [], Hotel::HERRAMIENTAS),
            'mayor_reto' => $data['mayor_reto'] ?? null,
            'sugerencias' => $data['sugerencias'] ?? null,
            'destacado' => (bool) ($data['destacado'] ?? false),
            'estado' => $estado,
            'publicado_en' => $publicadoEn,
        ];
    }

    /**
     * @param  array<int, mixed>  $values
     * @param  list<string>  $allowed
     * @return list<string>
     */
    private function onlyAllowed(array $values, array $allowed): array
    {
        return array_values(array_intersect($allowed, array_map('strval', $values)));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncMedia(Hotel $hotel, array $data): void
    {
        if (($data['cover'] ?? null) instanceof UploadedFile) {
            $url = $this->mediaStorage->storeCover($data['cover'], $hotel);
            $hotel->update(['imagen_portada_url' => $url]);
        }

        $removeIds = array_values(array_unique(array_map('strval', $data['remove_media_ids'] ?? [])));
        if ($removeIds !== []) {
            $toDelete = HotelMedia::query()
                ->where('hotel_id', $hotel->id)
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

        $nextSort = (int) HotelMedia::query()->where('hotel_id', $hotel->id)->max('sort_order');

        foreach ($gallery as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }
            $nextSort++;
            $this->mediaStorage->storeGalleryItem($file, $hotel, $nextSort);
        }
    }

    private function uniqueSlug(string $base, ?string $ignoreId = null): string
    {
        $slug = $base !== '' ? $base : 'hotel';
        $candidate = $slug;
        $i = 2;

        while (
            Hotel::withTrashed()
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
