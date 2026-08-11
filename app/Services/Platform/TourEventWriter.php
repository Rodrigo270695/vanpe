<?php

namespace App\Services\Platform;

use App\Models\TourEvent;
use App\Models\TourEventSponsor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TourEventWriter
{
    public function __construct(
        private readonly TourEventMediaStorage $media,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $sponsors
     */
    public function create(array $data, array $sponsors = []): TourEvent
    {
        return DB::transaction(function () use ($data, $sponsors): TourEvent {
            $event = TourEvent::query()->create($this->normalize($data));
            $this->syncCover($event, $data);
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
            $this->syncCover($event, $data);
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

        $portada = $existing?->portada_url;
        if (! empty($data['remove_cover'])) {
            $this->media->deleteIfExists($portada);
            $portada = null;
        }

        return [
            'owner_type' => $data['owner_type'] ?? $existing?->owner_type ?? TourEvent::OWNER_PLATFORM,
            'tenant_id' => array_key_exists('tenant_id', $data)
                ? $data['tenant_id']
                : $existing?->tenant_id,
            'titulo' => $titulo,
            'slug' => $slug,
            'resumen' => $data['resumen'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'portada_url' => $portada,
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

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncCover(TourEvent $event, array $data): void
    {
        if (! empty($data['cover']) && $data['cover'] instanceof UploadedFile) {
            $url = $this->media->storeCover($data['cover'], $event);
            $event->update(['portada_url' => $url]);
        }
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
        $oldLogos = $event->sponsors()
            ->pluck('logo_url')
            ->filter(fn ($url) => filled($url))
            ->values()
            ->all();

        $event->sponsors()->delete();

        $kept = [];

        foreach (array_values($sponsors) as $index => $row) {
            $nombre = trim((string) ($row['nombre'] ?? ''));
            if ($nombre === '') {
                continue;
            }

            $logoUrl = null;
            if (! empty($row['logo']) && $row['logo'] instanceof UploadedFile) {
                $logoUrl = $this->media->storeSponsorLogo($row['logo'], $event, $index);
            } elseif (! empty($row['remove_logo'])) {
                $logoUrl = null;
            } else {
                $existing = $row['logo_url'] ?? null;
                $logoUrl = filled($existing) ? (string) $existing : null;
            }

            if ($logoUrl !== null) {
                $kept[] = $logoUrl;
            }

            TourEventSponsor::query()->create([
                'tour_event_id' => $event->id,
                'nombre' => $nombre,
                'tipo' => in_array($row['tipo'] ?? '', TourEventSponsor::TIPOS, true)
                    ? $row['tipo']
                    : 'auspiciador',
                'logo_url' => $logoUrl,
                'website' => filled($row['website'] ?? null) ? (string) $row['website'] : null,
                'sort_order' => (int) ($row['sort_order'] ?? $index + 1),
            ]);
        }

        foreach ($oldLogos as $url) {
            if (! in_array($url, $kept, true)) {
                $this->media->deleteIfExists((string) $url);
            }
        }
    }
}
