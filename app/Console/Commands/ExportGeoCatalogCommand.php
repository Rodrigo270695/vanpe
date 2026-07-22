<?php

namespace App\Console\Commands;

use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/** Exporta el ubigeo local a JSON para copiarlo a un VPS sin acceso a VetSaaS. */
class ExportGeoCatalogCommand extends Command
{
    protected $signature = 'geo:export-catalog
                            {path=storage/app/geo-catalog.json : Ruta del archivo de salida}';

    protected $description = 'Exporta paises, departamentos, provincias y distritos a un JSON';

    public function handle(): int
    {
        $path = base_path((string) $this->argument('path'));
        File::ensureDirectoryExists(dirname($path));

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'paises' => DB::table('paises')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'departamentos' => DB::table('departamentos')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'provincias' => DB::table('provincias')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
            'distritos' => DB::table('distritos')->orderBy('id')->get()->map(fn ($r) => (array) $r)->all(),
        ];

        File::put($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        $this->components->info("Catálogo exportado: {$path}");
        $this->table(
            ['Tabla', 'Filas'],
            [
                ['paises', count($payload['paises'])],
                ['departamentos', count($payload['departamentos'])],
                ['provincias', count($payload['provincias'])],
                ['distritos', count($payload['distritos'])],
            ],
        );

        return self::SUCCESS;
    }
}
