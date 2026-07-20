<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Services\Platform\PlatformAuditLogger;
use App\Services\Platform\PublicCatalogProvisioner;
use App\Services\Subscription\TrialSubscriptionProvisioner;
use App\Support\RoleProvisioner;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

/**
 * Aprovisiona un restaurante completo:
 *   1) crea el registro `tenants` (schema public),
 *   2) crea su schema PostgreSQL aislado (rst_xxxxxx),
 *   3) corre las migraciones del tenant en ese schema,
 *   4) siembra los roles del tenant (owner, admin, cajero, mozo, cocinero),
 *   5) crea el usuario dueño (owner),
 *   6) crea la suscripción trial inicial,
 *   7) crea la ficha pública vacía (`pub_restaurants`),
 *   8) registra auditoría de plataforma (`platform_audit_logs`).
 */
class TenantProvisioner
{
    private const TENANT_MIGRATIONS_PATH = 'database/migrations/tenant';

    public function __construct(
        private readonly TrialSubscriptionProvisioner $trialSubscriptionProvisioner,
        private readonly PublicCatalogProvisioner $publicCatalogProvisioner,
        private readonly PlatformAuditLogger $platformAuditLogger,
        private readonly TenantDefaultsSeeder $tenantDefaultsSeeder,
    ) {}

    /**
     * @param  array{
     *     slug: string,
     *     razon_social: string,
     *     nombre_comercial: string,
     *     email_admin: string,
     *     ruc?: string|null,
     *     telefono?: string|null,
     *     departamento_id?: int|null,
     *     provincia_id?: int|null,
     *     distrito_id?: int|null,
     *     actor_type?: string,
     *     actor_id?: string|null,
     *     owner: array{name: string, email: string, password: string, username?: string|null, telefono?: string|null, email_verified_at?: \DateTimeInterface|null}
     * }  $data
     */
    public function provision(array $data): Tenant
    {
        $schema = $this->generateSchemaName();

        $tenant = Tenant::create([
            'slug' => $data['slug'],
            'schema_name' => $schema,
            'razon_social' => $data['razon_social'],
            'nombre_comercial' => $data['nombre_comercial'],
            'ruc' => $data['ruc'] ?? null,
            'email_admin' => $data['email_admin'],
            'telefono' => $data['telefono'] ?? null,
            'departamento_id' => $data['departamento_id'] ?? null,
            'provincia_id' => $data['provincia_id'] ?? null,
            'distrito_id' => $data['distrito_id'] ?? null,
            'estado' => 'trial',
        ]);

        try {
            $this->createSchema($schema);
            $this->migrateSchema($schema);
            $this->tenantDefaultsSeeder->seed($schema);
            $this->seedRolesAndOwner($schema, $data['owner']);
            $this->trialSubscriptionProvisioner->provisionForTenant($tenant);
            $this->publicCatalogProvisioner->createStubForTenant($tenant);
            $this->platformAuditLogger->record(
                action: 'tenant.provisioned',
                entity: 'tenants',
                entityId: $tenant->id,
                data: [
                    'slug' => $tenant->slug,
                    'schema_name' => $tenant->schema_name,
                    'nombre_comercial' => $tenant->nombre_comercial,
                ],
                actorType: $data['actor_type'] ?? 'system',
                actorId: $data['actor_id'] ?? null,
            );
        } catch (Throwable $e) {
            $this->dropSchema($schema);
            $tenant->forceDelete();

            throw $e;
        }

        return $tenant->fresh();
    }

    /**
     * Devuelve el usuario dueño (owner) del tenant, fijando su schema.
     */
    public function getOwner(Tenant $tenant): ?TenantUser
    {
        $this->useTenantSchema($tenant->schema_name);

        return TenantUser::where('es_owner', true)->first();
    }

    /**
     * Fija el schema del tenant en la conexión 'tenant' para operar sobre él.
     */
    public function bindSchema(Tenant $tenant): void
    {
        $this->useTenantSchema($tenant->schema_name);
    }

    private function generateSchemaName(): string
    {
        do {
            $random = preg_replace('/[^a-z0-9]/', '0', Str::lower(Str::random(6)));
            $schema = 'rst_'.$random;
        } while (Tenant::where('schema_name', $schema)->exists());

        return $schema;
    }

    private function createSchema(string $schema): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS "'.$schema.'"');
    }

    private function dropSchema(string $schema): void
    {
        DB::statement('DROP SCHEMA IF EXISTS "'.$schema.'" CASCADE');
    }

    private function migrateSchema(string $schema): void
    {
        $this->useTenantSchema($schema);

        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => self::TENANT_MIGRATIONS_PATH,
            '--force' => true,
        ]);
    }

    /**
     * @param  array{name: string, email: string, password: string, username?: string|null, telefono?: string|null, email_verified_at?: \DateTimeInterface|null}  $owner
     */
    private function seedRolesAndOwner(string $schema, array $owner): void
    {
        $this->useTenantSchema($schema);

        $previousDefault = Config::get('database.default');
        DB::setDefaultConnection('tenant');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        try {
            RoleProvisioner::provision('tenant');

            $user = TenantUser::create([
                'name' => $owner['name'],
                'email' => $owner['email'],
                'username' => $owner['username'] ?? Str::before($owner['email'], '@'),
                'password' => $owner['password'],
                'telefono' => $owner['telefono'] ?? null,
                'activo' => true,
                'es_owner' => true,
                'email_verified_at' => $owner['email_verified_at'] ?? null,
            ]);

            $user->assignRole('owner');
        } finally {
            DB::setDefaultConnection($previousDefault);
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }
    }

    private function useTenantSchema(string $schema): void
    {
        Config::set('database.connections.tenant.search_path', $schema);
        DB::purge('tenant');
    }
}
