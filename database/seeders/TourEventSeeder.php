<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Orquesta los seeders de ferias y festividades.
 */
class TourEventSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TourEventRegionalSeeder::class,
            TourEventNationalSeeder::class,
            TourEventTenantSeeder::class,
        ]);
    }
}
