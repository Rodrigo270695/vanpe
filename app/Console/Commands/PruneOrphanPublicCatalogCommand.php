<?php

namespace App\Console\Commands;

use App\Models\PubRestaurant;
use App\Models\Tenant;
use Illuminate\Console\Command;

/**
 * Desactiva fichas públicas huérfanas o no visibles (sin tenant vivo/publicado).
 * Útil tras borrar tenants sin sincronizar el catálogo de la app.
 */
class PruneOrphanPublicCatalogCommand extends Command
{
    protected $signature = 'vanpe:prune-orphan-catalog
                            {--dry-run : Solo listar, no desactivar}
                            {--delete : Eliminar filas huérfanas en vez de solo desactivar}';

    protected $description = 'Desactiva (o elimina) pub_restaurants sin tenant vivo/publicado';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $delete = (bool) $this->option('delete');

        $aliveTenantIds = Tenant::query()->pluck('id');

        $orphans = PubRestaurant::query()
            ->where(function ($q) use ($aliveTenantIds): void {
                $q->whereNotIn('tenant_id', $aliveTenantIds)
                    ->orWhereDoesntHave('tenant', function ($tq): void {
                        $tq->where('publicado', true)
                            ->whereIn('estado', ['trial', 'active']);
                    });
            })
            ->orderBy('nombre')
            ->get(['id', 'slug', 'nombre', 'tenant_id', 'activo']);

        if ($orphans->isEmpty()) {
            $this->info('No hay fichas huérfanas o no visibles.');

            return self::SUCCESS;
        }

        $this->table(
            ['slug', 'nombre', 'activo', 'tenant_id'],
            $orphans->map(fn (PubRestaurant $r): array => [
                $r->slug,
                $r->nombre,
                $r->activo ? '1' : '0',
                (string) $r->tenant_id,
            ])->all(),
        );

        if ($dryRun) {
            $this->warn("Dry-run: {$orphans->count()} ficha(s). Sin cambios.");

            return self::SUCCESS;
        }

        if ($delete) {
            $count = PubRestaurant::query()->whereIn('id', $orphans->pluck('id'))->delete();
            $this->info("Eliminadas {$count} ficha(s) públicas.");
        } else {
            $count = PubRestaurant::query()
                ->whereIn('id', $orphans->pluck('id'))
                ->update(['activo' => false, 'publicado_en' => null, 'sincronizado_en' => now()]);
            $this->info("Desactivadas {$count} ficha(s) públicas.");
        }

        return self::SUCCESS;
    }
}
