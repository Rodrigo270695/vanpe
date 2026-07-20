<?php

namespace App\Services\Geo;

use App\Support\Geo\MojibakeFixer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GeoCatalogImporter
{
    /**
     * @var array<string, list<string>>
     */
    private const TABLE_COLUMNS = [
        'paises' => ['id', 'name', 'status', 'created_at', 'updated_at'],
        'departamentos' => ['id', 'pais_id', 'name', 'status', 'created_at', 'updated_at'],
        'provincias' => ['id', 'departamento_id', 'name', 'status', 'created_at', 'updated_at'],
        'distritos' => ['id', 'provincia_id', 'name', 'status', 'created_at', 'updated_at'],
    ];

    /**
     * @var list<string>
     */
    private const IMPORT_ORDER = [
        'paises',
        'departamentos',
        'provincias',
        'distritos',
    ];

    /**
     * @return array<string, int>
     */
    public function import(string $sourceConnection = 'vetsaas', bool $fresh = false): array
    {
        $this->assertSourceConnection($sourceConnection);

        if ($fresh) {
            $this->truncateLocalCatalog();
        }

        $counts = [];

        foreach (self::IMPORT_ORDER as $table) {
            $counts[$table] = $this->importTable($table, $sourceConnection);
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            $this->resetSequences();
        }

        return $counts;
    }

    public function truncateLocalCatalog(): void
    {
        DB::statement('TRUNCATE TABLE distritos, provincias, departamentos, paises RESTART IDENTITY CASCADE');
    }

    private function assertSourceConnection(string $connection): void
    {
        try {
            DB::connection($connection)->getPdo();
        } catch (\Throwable $exception) {
            throw new RuntimeException(
                "No se pudo conectar a la base de datos origen [{$connection}]. "
                .'Revisa VETSAAS_DB_* en tu .env.',
                previous: $exception,
            );
        }

        foreach (self::IMPORT_ORDER as $table) {
            if (! DB::connection($connection)->getSchemaBuilder()->hasTable($table)) {
                throw new RuntimeException(
                    "La tabla [{$table}] no existe en la conexión [{$connection}].",
                );
            }
        }
    }

    private function importTable(string $table, string $sourceConnection): int
    {
        $columns = self::TABLE_COLUMNS[$table];
        $updateColumns = array_values(array_diff($columns, ['id']));
        $imported = 0;

        DB::connection($sourceConnection)
            ->table($table)
            ->orderBy('id')
            ->chunk(500, function (Collection $rows) use ($table, $columns, $updateColumns, &$imported): void {
                $payload = $rows
                    ->map(fn ($row) => $this->normalizeRow((array) $row, $columns))
                    ->all();

                DB::table($table)->upsert($payload, ['id'], $updateColumns);

                $imported += count($payload);
            });

        return $imported;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<string>  $columns
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row, array $columns): array
    {
        $normalized = [];

        foreach ($columns as $column) {
            $value = $row[$column] ?? null;

            if ($column === 'status') {
                $normalized[$column] = (bool) $value;

                continue;
            }

            if ($column === 'name' && is_string($value)) {
                $normalized[$column] = MojibakeFixer::repair($value);

                continue;
            }

            $normalized[$column] = $value;
        }

        return $normalized;
    }

    private function resetSequences(): void
    {
        foreach (self::IMPORT_ORDER as $table) {
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1))",
            );
        }
    }
}
