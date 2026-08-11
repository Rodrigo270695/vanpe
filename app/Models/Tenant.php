<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Negocio registrado en la plataforma (schema public): restaurante o centro turístico.
 *
 * @property string $id
 * @property string $slug
 * @property string $schema_name
 * @property string $tipo
 */
class Tenant extends Model
{
    use HasUuids, SoftDeletes;

    public const STATUSES = ['trial', 'active', 'suspended', 'cancelled'];

    public const TYPE_RESTAURANT = 'restaurant';

    public const TYPE_TOUR_SPOT = 'tour_spot';

    public const TYPES = [
        self::TYPE_RESTAURANT,
        self::TYPE_TOUR_SPOT,
    ];

    protected $fillable = [
        'slug',
        'schema_name',
        'tipo',
        'razon_social',
        'nombre_comercial',
        'ruc',
        'email_admin',
        'telefono',
        'logo_url',
        'portada_url',
        'departamento_id',
        'provincia_id',
        'distrito_id',
        'direccion',
        'latitud',
        'longitud',
        'estado',
        'trial_ends_at',
        'suspended_at',
        'suspension_reason',
        'cancelled_at',
        'onboarding_completado',
        'onboarding_paso',
        'publicado',
        'timezone',
        'locale',
        'canal_adquisicion',
    ];

    protected function casts(): array
    {
        return [
            'onboarding_completado' => 'boolean',
            'onboarding_paso' => 'integer',
            'publicado' => 'boolean',
            'latitud' => 'decimal:6',
            'longitud' => 'decimal:6',
            'trial_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function isRestaurant(): bool
    {
        return ($this->tipo ?: self::TYPE_RESTAURANT) === self::TYPE_RESTAURANT;
    }

    public function isTourSpot(): bool
    {
        return $this->tipo === self::TYPE_TOUR_SPOT;
    }

    /**
     * Host del subdominio del negocio, según el entorno (.env → config/tenant).
     * Ejemplo: negritalinda.vanpe.pe
     */
    public function subdomainHost(): string
    {
        $root = (string) config('tenant.root_domain', 'vanpe.pe');
        $host = "{$this->slug}.{$root}";

        $port = parse_url((string) config('app.url'), PHP_URL_PORT);

        return $port ? "{$host}:{$port}" : $host;
    }

    /**
     * URL completa del subdominio (con esquema y ruta opcional).
     */
    public function subdomainUrl(string $path = '/'): string
    {
        $scheme = (string) config('tenant.scheme', 'http');
        $path = '/'.ltrim($path, '/');

        return "{$scheme}://{$this->subdomainHost()}{$path}";
    }

    /** @return HasOne<Subscription, $this> */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /** @return HasOne<PubRestaurant, $this> */
    public function pubRestaurant(): HasOne
    {
        return $this->hasOne(PubRestaurant::class);
    }

    /** @return HasOne<TourSpot, $this> */
    public function tourSpot(): HasOne
    {
        return $this->hasOne(TourSpot::class);
    }
}
