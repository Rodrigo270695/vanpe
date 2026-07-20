<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PubRestaurant extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';

    protected $fillable = [
        'tenant_id',
        'departamento_id',
        'provincia_id',
        'distrito_id',
        'nombre',
        'slug',
        'descripcion',
        'direccion',
        'latitud',
        'longitud',
        'telefono',
        'whatsapp',
        'tipo_cocina',
        'rango_precio',
        'logo_url',
        'portada_url',
        'acepta_reservas',
        'anticipacion_min_horas',
        'capacidad_max_grupo',
        'rating_promedio',
        'total_resenas',
        'total_reservas',
        'destacado',
        'destacado_hasta',
        'score_ranking',
        'activo',
        'publicado_en',
        'sincronizado_en',
    ];

    protected function casts(): array
    {
        return [
            'tipo_cocina' => 'array',
            'latitud' => 'decimal:6',
            'longitud' => 'decimal:6',
            'rating_promedio' => 'decimal:2',
            'score_ranking' => 'decimal:4',
            'acepta_reservas' => 'boolean',
            'destacado' => 'boolean',
            'activo' => 'boolean',
            'destacado_hasta' => 'datetime',
            'publicado_en' => 'datetime',
            'sincronizado_en' => 'datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return HasMany<PubRestaurantPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(PubRestaurantPhoto::class, 'tenant_id', 'tenant_id');
    }

    /** @return HasMany<PubRestaurantHour, $this> */
    public function hours(): HasMany
    {
        return $this->hasMany(PubRestaurantHour::class, 'tenant_id', 'tenant_id');
    }

    /** @return HasMany<PubMenuHighlight, $this> */
    public function highlights(): HasMany
    {
        return $this->hasMany(PubMenuHighlight::class, 'tenant_id', 'tenant_id');
    }

    /** @return HasMany<PubRestaurantCatalogItem, $this> */
    public function catalogItems(): HasMany
    {
        return $this->hasMany(PubRestaurantCatalogItem::class, 'tenant_id', 'tenant_id');
    }

    /** @return HasMany<PubAvailabilitySlot, $this> */
    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(PubAvailabilitySlot::class, 'tenant_id', 'tenant_id');
    }
}
