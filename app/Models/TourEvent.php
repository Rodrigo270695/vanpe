<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TourEvent extends Model
{
    use HasUuids, SoftDeletes;

    public const OWNER_PLATFORM = 'platform';

    public const OWNER_TENANT = 'tenant';

    public const ESTADO_BORRADOR = 'borrador';

    public const ESTADO_PUBLICADO = 'publicado';

    public const ESTADO_ARCHIVADO = 'archivado';

    protected $table = 'tour_events';

    protected $fillable = [
        'owner_type',
        'tenant_id',
        'titulo',
        'slug',
        'resumen',
        'descripcion',
        'portada_url',
        'lugar',
        'departamento_id',
        'provincia_id',
        'distrito_id',
        'latitud',
        'longitud',
        'starts_at',
        'ends_at',
        'estado',
        'destacado',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'destacado' => 'boolean',
            'latitud' => 'float',
            'longitud' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public function sponsors(): HasMany
    {
        return $this->hasMany(TourEventSponsor::class)->orderBy('sort_order');
    }

    public function media(): HasMany
    {
        return $this->hasMany(TourEventMedia::class)->orderBy('sort_order');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
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

    public function scopePublished($query)
    {
        return $query->where('estado', self::ESTADO_PUBLICADO);
    }

    public function scopeActiveWindow($query)
    {
        $now = now('America/Lima');

        return $query
            ->where(function ($q) use ($now): void {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now->copy()->subDay());
            });
    }
}
