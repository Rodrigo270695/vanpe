<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

/**
 * Importa ubigeo desde JSON (geo:export-catalog) sin necesitar VetSaaS.
 * Remapea FKs por nombre para no romper centros/restaurantes del seeder mínimo.
 */
class ImportGeoCatalogCommand extends Command
{
    protected $signature = 'geo:import-catalog
                            {path=database/data/geo-catalog.json.gz : Ruta del JSON o .json.gz exportado}
                            {--force : No pedir confirmación}';

    protected $description = 'Importa paises/departamentos/provincias/distritos desde un JSON y remapea FKs';

    public function handle(): int
    {
        $path = (string) $this->argument('path');
        $absolute = preg_match('/^(?:[\/\\\\]|[A-Za-z]:[\/\\\\])/', $path) === 1
            ? $path
            : base_path($path);

        if (! File::exists($absolute)) {
            $this->components->error("No existe el archivo: {$absolute}");

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('Se actualizará el catálogo geográfico y se remapean FKs. ¿Continuar?', true)) {
            $this->components->warn('Importación cancelada.');

            return self::FAILURE;
        }

        $raw = str_ends_with(strtolower($absolute), '.gz')
            ? (gzdecode(File::get($absolute)) ?: throw new \RuntimeException('No se pudo descomprimir el .gz'))
            : File::get($absolute);

        /** @var array{
         *   paises: list<array<string, mixed>>,
         *   departamentos: list<array<string, mixed>>,
         *   provincias: list<array<string, mixed>>,
         *   distritos: list<array<string, mixed>>
         * } $payload
         */
        $payload = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

        foreach (['paises', 'departamentos', 'provincias', 'distritos'] as $table) {
            if (empty($payload[$table]) || ! is_array($payload[$table])) {
                $this->components->error("JSON inválido: falta {$table}");

                return self::FAILURE;
            }
        }

        DB::transaction(function () use ($payload): void {
            // 1) Insertar filas nuevas sin pisar IDs existentes (ON CONFLICT DO NOTHING).
            $this->upsertTable('paises', $payload['paises'], insertOnly: true);
            $this->upsertTable('departamentos', $payload['departamentos'], insertOnly: true);
            $this->upsertTable('provincias', $payload['provincias'], insertOnly: true);
            $this->upsertTable('distritos', $payload['distritos'], insertOnly: true);

            // 2) Remapear FKs por nombre hacia los IDs del catálogo importado.
            $this->remapForeignKeys($payload);

            // 3) Upsert completo (ahora sí puede sobrescribir id=1 AMAZONAS, etc.).
            $this->upsertTable('paises', $payload['paises'], insertOnly: false);
            $this->upsertTable('departamentos', $payload['departamentos'], insertOnly: false);
            $this->upsertTable('provincias', $payload['provincias'], insertOnly: false);
            $this->upsertTable('distritos', $payload['distritos'], insertOnly: false);

            // 4) Eliminar huérfanos del seeder mínimo que no estén en el catálogo.
            $this->deleteOrphans($payload);

            if (DB::connection()->getDriverName() === 'pgsql') {
                foreach (['paises', 'departamentos', 'provincias', 'distritos'] as $table) {
                    DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1))");
                }
            }
        });

        $this->components->info('Catálogo geográfico importado y FKs remapeadas.');
        $this->table(
            ['Tabla', 'Total'],
            [
                ['paises', DB::table('paises')->count()],
                ['departamentos', DB::table('departamentos')->count()],
                ['provincias', DB::table('provincias')->count()],
                ['distritos', DB::table('distritos')->count()],
            ],
        );

        return self::SUCCESS;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function upsertTable(string $table, array $rows, bool $insertOnly): void
    {
        $columns = match ($table) {
            'paises' => ['id', 'name', 'status', 'created_at', 'updated_at'],
            'departamentos' => ['id', 'pais_id', 'name', 'status', 'created_at', 'updated_at'],
            'provincias' => ['id', 'departamento_id', 'name', 'status', 'created_at', 'updated_at'],
            'distritos' => ['id', 'provincia_id', 'name', 'status', 'created_at', 'updated_at'],
            default => throw new \InvalidArgumentException($table),
        };

        $now = now();
        $chunk = [];

        foreach ($rows as $row) {
            $normalized = [];
            foreach ($columns as $column) {
                $value = $row[$column] ?? null;
                if (in_array($column, ['created_at', 'updated_at'], true) && $value === null) {
                    $value = $now;
                }
                if ($column === 'status') {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $value;
                }
                $normalized[$column] = $value;
            }
            $chunk[] = $normalized;

            if (count($chunk) >= 500) {
                $this->flushChunk($table, $columns, $chunk, $insertOnly);
                $chunk = [];
            }
        }

        if ($chunk !== []) {
            $this->flushChunk($table, $columns, $chunk, $insertOnly);
        }
    }

    /**
     * @param  list<string>  $columns
     * @param  list<array<string, mixed>>  $chunk
     */
    private function flushChunk(string $table, array $columns, array $chunk, bool $insertOnly): void
    {
        if ($insertOnly) {
            DB::table($table)->insertOrIgnore($chunk);

            return;
        }

        $update = array_values(array_diff($columns, ['id']));
        DB::table($table)->upsert($chunk, ['id'], $update);
    }

    /**
     * @param  array{
     *   departamentos: list<array<string, mixed>>,
     *   provincias: list<array<string, mixed>>,
     *   distritos: list<array<string, mixed>>
     * }  $payload
     */
    private function remapForeignKeys(array $payload): void
    {
        $depByName = [];
        foreach ($payload['departamentos'] as $row) {
            $depByName[$this->norm((string) $row['name'])] = (int) $row['id'];
        }

        $provByKey = [];
        foreach ($payload['provincias'] as $row) {
            $key = (int) $row['departamento_id'].'|'.$this->norm((string) $row['name']);
            $provByKey[$key] = (int) $row['id'];
        }

        $distByKey = [];
        foreach ($payload['distritos'] as $row) {
            $key = (int) $row['provincia_id'].'|'.$this->norm((string) $row['name']);
            $distByKey[$key] = (int) $row['id'];
        }

        $tables = [
            'tour_spots' => ['departamento_id', 'provincia_id', 'distrito_id'],
            'pub_restaurants' => ['departamento_id', 'provincia_id', 'distrito_id'],
            'tenants' => ['departamento_id', 'provincia_id', 'distrito_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $rows = DB::table($table)
                ->leftJoin('departamentos as d', 'd.id', '=', "{$table}.departamento_id")
                ->leftJoin('provincias as p', 'p.id', '=', "{$table}.provincia_id")
                ->leftJoin('distritos as di', 'di.id', '=', "{$table}.distrito_id")
                ->select([
                    "{$table}.id",
                    'd.name as dep_name',
                    'p.name as prov_name',
                    'di.name as dist_name',
                ])
                ->get();

            foreach ($rows as $row) {
                $updates = [];

                $depId = $row->dep_name ? ($depByName[$this->norm((string) $row->dep_name)] ?? null) : null;
                if ($depId) {
                    $updates['departamento_id'] = $depId;
                }

                if ($depId && $row->prov_name) {
                    $provId = $provByKey[$depId.'|'.$this->norm((string) $row->prov_name)] ?? null;
                    if ($provId) {
                        $updates['provincia_id'] = $provId;
                    }
                } else {
                    $provId = null;
                }

                if (! empty($provId) && $row->dist_name) {
                    $distId = $distByKey[$provId.'|'.$this->norm((string) $row->dist_name)] ?? null;
                    if ($distId) {
                        $updates['distrito_id'] = $distId;
                    }
                }

                if ($updates !== []) {
                    DB::table($table)->where('id', $row->id)->update($updates);
                }
            }
        }
    }

    /**
     * @param  array{
     *   paises: list<array<string, mixed>>,
     *   departamentos: list<array<string, mixed>>,
     *   provincias: list<array<string, mixed>>,
     *   distritos: list<array<string, mixed>>
     * }  $payload
     */
    private function deleteOrphans(array $payload): void
    {
        $ids = [
            'distritos' => collect($payload['distritos'])->pluck('id')->all(),
            'provincias' => collect($payload['provincias'])->pluck('id')->all(),
            'departamentos' => collect($payload['departamentos'])->pluck('id')->all(),
            'paises' => collect($payload['paises'])->pluck('id')->all(),
        ];

        DB::table('distritos')->whereNotIn('id', $ids['distritos'])->delete();
        DB::table('provincias')->whereNotIn('id', $ids['provincias'])->delete();
        DB::table('departamentos')->whereNotIn('id', $ids['departamentos'])->delete();
        DB::table('paises')->whereNotIn('id', $ids['paises'])->delete();
    }

    private function norm(string $name): string
    {
        return mb_strtoupper(trim($name), 'UTF-8');
    }
}
