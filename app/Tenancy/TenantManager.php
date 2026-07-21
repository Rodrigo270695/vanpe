<?php

namespace App\Tenancy;

use App\Models\Tenant;
use App\Tenancy\Exceptions\TenantNotFoundException;
use App\Tenancy\Exceptions\TenantUnavailableException;
use Illuminate\Support\Facades\DB;

/**
 * Resuelve el tenant activo y aísla su base de datos fijando el `search_path`
 * de la conexión `tenant` al schema físico del restaurante (rst_*).
 *
 * La conexión por defecto (`pgsql`) permanece SIEMPRE en `public`, así que
 * sesiones, cache, jobs y la tabla `tenants` no se ven afectados.
 */
class TenantManager
{
    private const CONNECTION = 'tenant';

    protected ?TenantContext $current = null;

    public function check(): bool
    {
        return $this->current !== null;
    }

    public function current(): ?TenantContext
    {
        return $this->current;
    }

    public function tenant(): ?Tenant
    {
        return $this->current?->tenant;
    }

    /**
     * Resuelve el tenant por slug y fija su schema. Lanza si no existe o no está disponible.
     */
    public function resolveBySlug(string $slug): TenantContext
    {
        $tenant = $this->findBySlug($slug);

        if ($tenant === null) {
            throw new TenantNotFoundException($slug);
        }

        if (! in_array((string) $tenant->estado, (array) config('tenant.allowed_states', []), true)) {
            throw new TenantUnavailableException($tenant);
        }

        $schema = $this->safeSchemaName($tenant);

        if ($schema === null) {
            throw new TenantNotFoundException($slug);
        }

        $this->applySearchPath($schema);

        $timezone = filled($tenant->timezone) ? (string) $tenant->timezone : 'America/Lima';
        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);

        return $this->current = new TenantContext(
            tenant: $tenant,
            schema: $schema,
            slug: (string) $tenant->slug,
        );
    }

    /**
     * Restaura el estado neutro (public) en la conexión de tenant.
     */
    public function forget(): void
    {
        if (DB::getDefaultConnection() !== 'pgsql') {
            $this->current = null;

            return;
        }

        $conn = DB::connection(self::CONNECTION);

        if ($conn->getDriverName() === 'pgsql') {
            $conn->statement('SET search_path TO public');
        }

        config(['app.timezone' => 'UTC']);
        date_default_timezone_set('UTC');

        $this->current = null;
    }

    protected function findBySlug(string $slug): ?Tenant
    {
        return Tenant::query()->where('slug', $slug)->first();
    }

    protected function applySearchPath(string $schema): void
    {
        $conn = DB::connection(self::CONNECTION);

        if ($conn->getDriverName() !== 'pgsql') {
            return;
        }

        $conn->statement('SET search_path TO "'.$schema.'", public');
    }

    /**
     * Sanea el nombre del schema leído de la BD (nunca de la request) antes de
     * inyectarlo en SQL, y exige el prefijo configurado.
     */
    protected function safeSchemaName(Tenant $tenant): ?string
    {
        $raw = strtolower((string) ($tenant->schema_name ?? ''));
        $clean = preg_replace('/[^a-z0-9_]/', '', $raw) ?? '';

        if ($clean === '' || strlen($clean) > 63) {
            return null;
        }

        if (! preg_match('/^[a-z_][a-z0-9_]*$/', $clean)) {
            return null;
        }

        $prefix = (string) config('tenant.schema_prefix', '');
        if ($prefix !== '' && ! str_starts_with($clean, $prefix)) {
            return null;
        }

        return $clean;
    }
}
