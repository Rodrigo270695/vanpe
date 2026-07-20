<?php

namespace App\Console\Commands;

use App\Services\Geo\GeoCatalogImporter;
use Illuminate\Console\Command;

class ImportGeoFromVetsaasCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'geo:import-from-vetsaas
                            {--fresh : Vacía el catálogo local antes de importar}
                            {--connection=vetsaas : Conexión Laravel de la base origen}';

    /**
     * @var string
     */
    protected $description = 'Importa paises, departamentos, provincias y distritos desde la base VetSaaS';

    public function handle(GeoCatalogImporter $importer): int
    {
        $connection = (string) $this->option('connection');
        $fresh = (bool) $this->option('fresh');

        if ($fresh && ! $this->confirm('Se vaciará el catálogo geográfico local. ¿Continuar?', false)) {
            $this->components->warn('Importación cancelada.');

            return self::FAILURE;
        }

        $this->components->info(
            $fresh
                ? 'Importando catálogo geográfico desde VetSaaS (modo fresh)...'
                : 'Importando catálogo geográfico desde VetSaaS...',
        );

        try {
            $counts = $importer->import($connection, $fresh);
        } catch (\Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->table(
            ['Tabla', 'Registros importados'],
            collect($counts)->map(fn (int $count, string $table) => [$table, $count])->values()->all(),
        );

        $this->newLine();
        $this->components->info('Importación completada.');
        $this->line('Puedes volver a ejecutar este comando cuando quieras; no se pierde con <comment>php artisan migrate</comment>.');
        $this->line('Si usas <comment>migrate:fresh</comment>, vuelve a correr <comment>php artisan geo:import-from-vetsaas</comment>.');
        $this->line('Si ves tildes corruptas (ej. PerÃº), ejecuta <comment>php artisan geo:fix-encoding</comment>.');

        return self::SUCCESS;
    }
}
