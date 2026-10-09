<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Platform\CraftCatalogProvisioner;
use App\Services\Platform\HotelCatalogProvisioner;
use App\Services\Platform\PublicCatalogProvisioner;
use App\Services\Platform\TourSpotCatalogProvisioner;
use Illuminate\Console\Command;

class ChangeTenantTypeCommand extends Command
{
    protected $signature = 'tenants:change-type
                            {tenant : Slug o correo del dueño}
                            {tipo? : restaurant, tour_spot, hotel o craft (vacío = solo mostrar)}';

    protected $description = 'Muestra o cambia el tipo de negocio de un tenant (crea su ficha y sincroniza roles)';

    public function handle(): int
    {
        $key = mb_strtolower(trim((string) $this->argument('tenant')));

        $tenant = Tenant::query()
            ->where('slug', $key)
            ->orWhereRaw('lower(email_admin) = ?', [$key])
            ->first();

        if ($tenant === null) {
            $this->components->error("No existe un tenant con slug o correo «{$key}».");

            return self::FAILURE;
        }

        $tipo = $this->argument('tipo');

        $this->components->twoColumnDetail('Tenant', "{$tenant->nombre_comercial} ({$tenant->slug})");
        $this->components->twoColumnDetail('Tipo actual', $tenant->tipo ?: Tenant::TYPE_RESTAURANT);

        if ($tipo === null) {
            return self::SUCCESS;
        }

        if (! in_array($tipo, Tenant::TYPES, true)) {
            $this->components->error('Tipo inválido. Usa: '.implode(', ', Tenant::TYPES).'.');

            return self::FAILURE;
        }

        $tenant->update(['tipo' => $tipo]);

        match ($tipo) {
            Tenant::TYPE_TOUR_SPOT => app(TourSpotCatalogProvisioner::class)->createStubForTenant($tenant),
            Tenant::TYPE_HOTEL => app(HotelCatalogProvisioner::class)->createStubForTenant($tenant),
            Tenant::TYPE_CRAFT => app(CraftCatalogProvisioner::class)->createStubForTenant($tenant),
            default => app(PublicCatalogProvisioner::class)->createStubForTenant($tenant),
        };

        $this->call('permissions:sync', ['--scope' => 'tenant', '--tenant' => $tenant->slug]);

        $this->components->info("Tipo cambiado a «{$tipo}». El usuario debe recargar la página.");

        return self::SUCCESS;
    }
}
