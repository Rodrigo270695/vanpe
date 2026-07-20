<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Platform\PublicCatalogSync;
use Illuminate\Console\Command;

class PublicCatalogSyncCommand extends Command
{
    protected $signature = 'public-catalog:sync
                            {--tenant= : Slug del restaurante}
                            {--entity=* : Entidades a sincronizar (ficha, galeria, horarios, catalogo, carta, disponibilidad)}
                            {--all-tenants : Sincronizar todos los tenants activos}';

    protected $description = 'Proyecta datos del tenant al catálogo público pub_*';

    public function handle(PublicCatalogSync $sync): int
    {
        $entities = $this->option('entity');
        $entityList = is_array($entities) && $entities !== [] ? $entities : [];

        $tenants = $this->resolveTenants();

        if ($tenants->isEmpty()) {
            $this->error('No se encontraron tenants para sincronizar.');

            return self::FAILURE;
        }

        foreach ($tenants as $tenant) {
            $this->info("Sincronizando {$tenant->slug}…");

            try {
                $sync->syncAll($tenant, $entityList);
                $this->line("  ✓ {$tenant->nombre_comercial}");
            } catch (\Throwable $e) {
                $this->error("  ✗ {$tenant->slug}: {$e->getMessage()}");
            }
        }

        $this->info('Listo.');

        return self::SUCCESS;
    }

    private function resolveTenants(): \Illuminate\Support\Collection
    {
        if ($this->option('all-tenants')) {
            return Tenant::query()
                ->whereIn('estado', ['trial', 'active'])
                ->orderBy('slug')
                ->get();
        }

        $slug = $this->option('tenant');

        if (! is_string($slug) || $slug === '') {
            $this->error('Indica --tenant=slug o --all-tenants');

            return collect();
        }

        $tenant = Tenant::query()->where('slug', $slug)->first();

        return $tenant ? collect([$tenant]) : collect();
    }
}
