<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ubigeo mínimo de Lambayeque para seeders de contenido en VPS
 * (no requiere VetSaaS). Idempotente por nombre.
 */
class LambayequeGeoSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('paises') || ! Schema::hasTable('distritos')) {
            $this->command?->error('Faltan tablas geográficas. Corre las migraciones primero.');

            return;
        }

        $paisId = $this->ensurePaisPeru();

        $departamento = Departamento::query()->firstOrCreate(
            ['pais_id' => $paisId, 'name' => 'LAMBAYEQUE'],
            ['status' => true],
        );

        $provincias = [
            'CHICLAYO' => [
                'CHICLAYO',
                'PIMENTEL',
                'MONSEFÚ',
                'ZAÑA',
                'POMALCA',
                'REQUE',
                'LA VICTORIA',
            ],
            'LAMBAYEQUE' => [
                'LAMBAYEQUE',
                'TÚCUME',
                'MÓROPE',
                'ILLIMO',
            ],
            'FERREÑAFE' => [
                'FERREÑAFE',
                'PÍTIPO',
                'PUEBLO NUEVO',
            ],
        ];

        foreach ($provincias as $provinciaName => $distritos) {
            $provincia = Provincia::query()->firstOrCreate(
                [
                    'departamento_id' => $departamento->id,
                    'name' => $provinciaName,
                ],
                ['status' => true],
            );

            foreach ($distritos as $distritoName) {
                Distrito::query()->firstOrCreate(
                    [
                        'provincia_id' => $provincia->id,
                        'name' => $distritoName,
                    ],
                    ['status' => true],
                );
            }
        }

        $this->command?->info('Ubigeo mínimo de Lambayeque listo (Perú → Lambayeque → provincias/distritos).');
    }

    private function ensurePaisPeru(): int
    {
        $existing = DB::table('paises')
            ->where('name', 'ilike', 'per%')
            ->orderBy('id')
            ->first();

        if ($existing !== null) {
            return (int) $existing->id;
        }

        return (int) DB::table('paises')->insertGetId([
            'name' => 'PERÚ',
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
