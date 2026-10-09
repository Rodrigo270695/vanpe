<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Artesanos y emprendimientos: artesanos, talleres y emprendimientos locales. */
class Craft extends Model
{
    use HasUuids, SoftDeletes;

    public const ESTADO_BORRADOR = 'borrador';

    public const ESTADO_PUBLICADO = 'publicado';

    public const ESTADO_PAUSADO = 'pausado';

    public const ESTADO_ARCHIVADO = 'archivado';

    public const ESTADOS = [
        self::ESTADO_BORRADOR,
        self::ESTADO_PUBLICADO,
        self::ESTADO_PAUSADO,
        self::ESTADO_ARCHIVADO,
    ];

    /** Redes que el formulario muestra por defecto. */
    public const REDES_DEFAULT = ['facebook', 'instagram', 'tiktok'];

    public const REDES_SOCIALES = ['facebook', 'instagram', 'tiktok', 'youtube', 'web'];

    protected $fillable = [
        'tenant_id',
        'nombre',
        'slug',
        'descripcion',
        'latitud',
        'longitud',
        'telefono_contacto',
        'redes_sociales',
        'imagen_portada_url',
        'rating_promedio',
        'total_resenas',
        'destacado',
        'score_ranking',
        'estado',
        'publicado_en',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'decimal:6',
            'longitud' => 'decimal:6',
            'redes_sociales' => 'array',
            'rating_promedio' => 'decimal:2',
            'total_resenas' => 'integer',
            'destacado' => 'boolean',
            'score_ranking' => 'decimal:4',
            'publicado_en' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(CraftMedia::class)->orderBy('sort_order');
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        $media = $this->relationLoaded('media')
            ? $this->media->map(fn (CraftMedia $item): array => [
                'id' => $item->id,
                'url' => $item->url,
                'titulo' => $item->titulo,
                'precio' => $item->precio !== null ? (float) $item->precio : null,
                'sort_order' => $item->sort_order,
            ])->values()->all()
            : [];

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'tenant_name' => $this->relationLoaded('tenant') ? $this->tenant?->nombre_comercial : null,
            'tenant_slug' => $this->relationLoaded('tenant') ? $this->tenant?->slug : null,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'descripcion' => $this->descripcion,
            'latitud' => $this->latitud !== null ? (float) $this->latitud : null,
            'longitud' => $this->longitud !== null ? (float) $this->longitud : null,
            'telefono_contacto' => $this->telefono_contacto,
            'redes_sociales' => array_values($this->redes_sociales ?? []),
            'imagen_portada_url' => $this->imagen_portada_url,
            'destacado' => $this->destacado,
            'estado' => $this->estado,
            'publicado_en' => $this->publicado_en?->toIso8601String(),
            'media' => $media,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
