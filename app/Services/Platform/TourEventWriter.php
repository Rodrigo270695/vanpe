<?php

namespace App\Services\Platform;

use App\Models\TourEvent;
use App\Models\TourEventSponsor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TourEventWriter
{
    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $sponsors
     */
    public function create(array $data, array $sponsors = []): TourEvent
    {
        return DB::transaction(function () use ($data, $sponsors): TourEvent {
            $event = TourEvent::query()->create($this->normalize($data));
            $this->syncSponsors($event, $sponsors);

            return $event->fresh(['sponsors', 'departamento', 'provincia', 'distrito']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $sponsors
     */
    public function update(TourEvent $event, array $data, array $sponsors = []): TourEvent
    {
        return DB::transaction(function () use ($event, $data, $sponsors): TourEvent {
            $event->update($this->normalize($data, $event));
            $this->syncSponsors($event, $sponsors);

            return $event->fresh(['sponsors', 'departamento', 'provincia', 'distrito']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data, ?TourEvent $existing = null): array
    {
        $titulo = trim((string) ($data['titulo'] ?? $existing?->titulo ?? ''));
        $slugBase = Str::slug((string) ($data['slug'] ?? $titulo));
        $slug = $this->uniqueSlug($slugBase !== '' ? $slugBase : 'evento', $existing?->id);

        return [
            'owner_type' => $data['owner_type'] ?? $existing?->owner_type ?? TourEvent::OWNER_PLATFORM,
            'tenant_id' => $data['tenant_id'] ?? $existing?->tenant_id,
            'titulo' => $titulo,
            'slug' => $slug,
            'resumen' => $data['resumen'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'portada_url' => $data['portada_url'] ?? $existing?->portada_url,
            'lugar' => $data['lugar'] ?? null,
            'departamento_id' => $data['departamento_id'] ?? null,
            'provincia_id' => $data['provincia_id'] ?? null,
            'distrito_id' => $data['distrito_id'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'estado' => $data['estado'] ?? $existing?->estado ?? TourEvent::ESTADO_BORRADOR,
            'destacado' => (bool) ($data['destacado'] ?? $existing?->destacado ?? false),
            'sort_order' => (int) ($data['sort_order'] ?? $existing?->sort_order ?? 0),
        ];
    }

    private function uniqueSlug(string $base, ?string $ignoreId = null): string
    {
        $slug = $base;
        $i = 1;
        while (
            TourEvent::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    /**
     * @param  list<array<string, mixed>>  $sponsors
     */
    private function syncSponsors(TourEvent $event, array $sponsors): void
    {
        $event->sponsors()->delete();

        foreach (array_values($sponsors) as $index => $row) {
            $nombre = trim((string) ($row['nombre'] ?? ''));
            if ($nombre === '') {
                continue;
            }

            TourEventSponsor::query()->create([
                'tour_event_id' => $event->id,
                'nombre' => $nombre,
                'tipo' => in_array($row['tipo'] ?? '', TourEventSponsor::TIPOS, true)
                    ? $row['tipo']
                    : 'auspiciador',
                'logo_url' => $row['logo_url'] ?? null,
                'website' => $row['website'] ?? null,
                'sort_order' => (int) ($row['sort_order'] ?? $index + 1),
            ]);
        }
    }
}
