<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Tenant\TenantDefaultsSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Ejecuta las migraciones del tenant (database/migrations/tenant) en el schema
 * de cada restaurante. Útil para aplicar cambios de esquema a tenants ya creados.
 *
 *   php artisan tenant:migrate
 *   php artisan tenant:migrate --tenant=elcantaro
 */
class TenantMigrateCommand extends Command
{
    protected $signature = 'tenant:migrate {--tenant= : Slug de un restaurante específico}';

    protected $description = 'Corre las migraciones del tenant en el/los schema(s) rst_*';

    private const TENANT_MIGRATIONS_PATH = 'database/migrations/tenant';

    public function handle(TenantDefaultsSeeder $defaultsSeeder): int
    {
        $query = Tenant::query();

        if ($slug = $this->option('tenant')) {
            $query->where('slug', $slug);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->warn('No hay restaurantes para migrar.');

            return self::SUCCESS;
        }

        foreach ($tenants as $tenant) {
            $schema = (string) $tenant->schema_name;
            $this->info("→ Migrando {$tenant->slug} [{$schema}]");

            Config::set('database.connections.tenant.search_path', $schema);
            DB::purge('tenant');

            Artisan::call('migrate', [
                '--database' => 'tenant',
                '--path' => self::TENANT_MIGRATIONS_PATH,
                '--force' => true,
            ], $this->getOutput());

            $defaultsSeeder->seed($schema);
        }

        // Restaurar estado neutro.
        Config::set('database.connections.tenant.search_path', 'public');
        DB::purge('tenant');

        $this->info('Listo.');

        return self::SUCCESS;
    }
}
