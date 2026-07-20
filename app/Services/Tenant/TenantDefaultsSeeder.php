<?php

namespace App\Services\Tenant;

use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\CfgServiceHour;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Siembra datos iniciales en un schema de restaurante recién migrado.
 */
class TenantDefaultsSeeder
{
    public function __construct(
        private readonly MenuStructureService $menuStructure,
    ) {}

    public function seed(string $schema): void
    {
        Config::set('database.connections.tenant.search_path', $schema);
        DB::purge('tenant');

        $previous = DB::getDefaultConnection();
        DB::setDefaultConnection('tenant');

        try {
            CfgSetting::ensureDefaults();
            CfgServiceHour::ensureDefaults();
            $this->menuStructure->ensureSystemCategories();
        } finally {
            DB::setDefaultConnection($previous);
        }
    }
}
