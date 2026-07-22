<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TourSpot extends Model
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

    public const DIFICULTADES = ['facil', 'moderado', 'dificil', 'extremo'];

    public const ESTACIONAMIENTOS = [
        'ninguno',
        'calle',
        'privado_gratis',
        'privado_pago',
        'desconocido',
    ];

    protected $fillable = [
        'departamento_id',
        'provincia_id',
        'distrito_id',
        'nombre',
        'slug',
        'resumen',
        'descripcion',
        'direccion',
        'referencia',
        'latitud',
        'longitud',
        'altitud_msnm',
        'telefono',
        'whatsapp',
        'website',
        'email',
        'es_gratuito',
        'precio_entrada_desde',
        'precio_entrada_hasta',
        'moneda',
        'requiere_reserva',
        'dificultad_acceso',
        'vialidad_principal',
        'tiempo_acceso_min',
        'distancia_acceso_km',
        'acceso_notas',
        'estacionamiento',
        'accesible_movilidad_reducida',
        'mejor_epoca',
        'duracion_visita_min',
        'horario_texto',
        'tips',
        'como_llegar',
        'imagen_portada_url',
        'rating_promedio',
        'total_resenas',
        'destacado',
        'destacado_hasta',
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
            'es_gratuito' => 'boolean',
            'precio_entrada_desde' => 'decimal:2',
            'precio_entrada_hasta' => 'decimal:2',
            'requiere_reserva' => 'boolean',
            'tiempo_acceso_min' => 'integer',
            'distancia_acceso_km' => 'decimal:2',
            'accesible_movilidad_reducida' => 'boolean',
            'duracion_visita_min' => 'integer',
            'tips' => 'array',
            'como_llegar' => 'array',
            'rating_promedio' => 'decimal:2',
            'total_resenas' => 'integer',
            'destacado' => 'boolean',
            'destacado_hasta' => 'datetime',
            'score_ranking' => 'decimal:4',
            'publicado_en' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function provincia(): BelongsTo
    {
        return $this->belongsTo(Provincia::class);
    }

    public function distrito(): BelongsTo
    {
        return $this->belongsTo(Distrito::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(TourCategory::class, 'tour_spot_categories')
            ->withPivot('is_primary');
    }

    public function accessModes(): BelongsToMany
    {
        return $this->belongsToMany(RefCatalogItem::class, 'tour_spot_access_modes', 'tour_spot_id', 'ref_catalog_item_id')
            ->withPivot(['recomendado', 'notas']);
    }

    public function inclusions(): BelongsToMany
    {
        return $this->belongsToMany(RefCatalogItem::class, 'tour_spot_inclusions', 'tour_spot_id', 'ref_catalog_item_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(TourSpotMedia::class)->orderBy('sort_order');
    }

    public function hours(): HasMany
    {
        return $this->hasMany(TourSpotHour::class)->orderBy('day_of_week');
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(?string $locale = null): array
    {
        $primaryCategory = $this->categories->firstWhere('pivot.is_primary', true)
            ?? $this->categories->first();

        $hours = $this->relationLoaded('hours')
            ? $this->hours->map(fn (TourSpotHour $hour): array => $hour->toAdminArray())->values()->all()
            : [];

        if ($hours === []) {
            $hours = TourSpotHour::defaultRows();
        }

        $media = $this->relationLoaded('media')
            ? $this->media->map(fn (TourSpotMedia $item): array => [
                'id' => $item->id,
                'url' => $item->url,
                'caption' => $item->caption,
                'sort_order' => $item->sort_order,
                'is_cover' => $item->is_cover,
            ])->values()->all()
            : [];

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'resumen' => $this->resumen,
            'descripcion' => $this->descripcion,
            'departamento_id' => $this->departamento_id,
            'provincia_id' => $this->provincia_id,
            'distrito_id' => $this->distrito_id,
            'departamento_name' => $this->departamento?->name,
            'provincia_name' => $this->provincia?->name,
            'distrito_name' => $this->distrito?->name,
            'direccion' => $this->direccion,
            'referencia' => $this->referencia,
            'latitud' => $this->latitud !== null ? (float) $this->latitud : null,
            'longitud' => $this->longitud !== null ? (float) $this->longitud : null,
            'telefono' => $this->telefono,
            'whatsapp' => $this->whatsapp,
            'website' => $this->website,
            'email' => $this->email,
            'es_gratuito' => $this->es_gratuito,
            'precio_entrada_desde' => $this->precio_entrada_desde !== null ? (float) $this->precio_entrada_desde : null,
            'precio_entrada_hasta' => $this->precio_entrada_hasta !== null ? (float) $this->precio_entrada_hasta : null,
            'moneda' => $this->moneda,
            'requiere_reserva' => $this->requiere_reserva,
            'dificultad_acceso' => $this->dificultad_acceso,
            'vialidad_principal' => $this->vialidad_principal,
            'tiempo_acceso_min' => $this->tiempo_acceso_min,
            'distancia_acceso_km' => $this->distancia_acceso_km !== null ? (float) $this->distancia_acceso_km : null,
            'acceso_notas' => $this->acceso_notas,
            'estacionamiento' => $this->estacionamiento,
            'accesible_movilidad_reducida' => $this->accesible_movilidad_reducida,
            'mejor_epoca' => $this->mejor_epoca,
            'duracion_visita_min' => $this->duracion_visita_min,
            'horario_texto' => $this->horario_texto,
            'tips' => $this->tips,
            'como_llegar' => $this->como_llegar,
            'imagen_portada_url' => $this->imagen_portada_url,
            'destacado' => $this->destacado,
            'estado' => $this->estado,
            'publicado_en' => $this->publicado_en?->toIso8601String(),
            'category_ids' => $this->categories->pluck('id')->values()->all(),
            'primary_category_id' => $primaryCategory?->id,
            'primary_category_name' => $primaryCategory?->labelForLocale($locale),
            'access_mode_ids' => $this->accessModes->pluck('id')->values()->all(),
            'inclusion_ids' => $this->inclusions->pluck('id')->values()->all(),
            'hours' => $hours,
            'media' => $media,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
