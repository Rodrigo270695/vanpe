<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Restaurante registrado en la plataforma (schema public).
 *
 * @property string $id
 * @property string $slug
 * @property string $schema_name
 */
class Tenant extends Model
{
    use HasUuids, SoftDeletes;

    public const STATUSES = ['trial', 'active', 'suspended', 'cancelled'];

    protected $fillable = [
        'slug',
        'schema_name',
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

    /**
     * Host del subdominio del restaurante, según el entorno (.env → config/tenant).
     * En local incluye el puerto: negritalinda.localhost:8000
     * En producción: negritalinda.vanpe.com.pe
     */
    public function subdomainHost(): string
    {
        $root = (string) config('tenant.root_domain', 'localhost');
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
}
