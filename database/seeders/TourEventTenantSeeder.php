<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TourEvent;
use App\Services\Platform\TourEventWriter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Aniversarios / eventos del restaurante (owner_type = tenant).
 */
class TourEventTenantSeeder extends Seeder
{
    public function run(): void
    {
        $writer = app(TourEventWriter::class);

        $tenants = Tenant::query()
            ->where('publicado', true)
            ->whereIn('slug', ['elcantaro', 'hebron-chiclayo', 'embarcadero41'])
            ->orderBy('slug')
            ->get();

        if ($tenants->isEmpty()) {
            $tenants = Tenant::query()
                ->where('publicado', true)
                ->orderBy('slug')
                ->limit(2)
                ->get();
        }

        if ($tenants->isEmpty()) {
            $this->command?->warn('TourEventTenantSeeder: no hay tenants publicados.');

            return;
        }

        foreach ($tenants as $index => $tenant) {
            $nombre = $tenant->nombre_comercial ?: $tenant->razon_social ?: $tenant->slug;
            $slug = 'aniversario-'.Str::slug($tenant->slug);

            if (TourEvent::query()->where('slug', $slug)->exists()) {
                continue;
            }

            $starts = now('America/Lima')->addWeeks(2 + $index)->startOfDay();
            $ends = $starts->copy()->addDays(1)->endOfDay();

            $writer->create([
                'titulo' => "Aniversario de {$nombre}",
                'slug' => $slug,
                'resumen' => "Celebramos un año más de {$nombre}. Menú especial, música en vivo y sorpresas.",
                'descripcion' => "Ven a celebrar con nosotros el aniversario de {$nombre}.\n"
                    ."Promociones del día, platos estrella y ambiente festivo para toda la familia.",
                'lugar' => $tenant->direccion ?: $nombre,
                'portada_url' => 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
                'starts_at' => $starts,
                'ends_at' => $ends,
                'departamento_id' => $tenant->departamento_id,
                'provincia_id' => $tenant->provincia_id,
                'distrito_id' => $tenant->distrito_id,
                'latitud' => $tenant->latitud,
                'longitud' => $tenant->longitud,
                'estado' => TourEvent::ESTADO_PUBLICADO,
                'destacado' => false,
                'sort_order' => 20 + $index,
                'owner_type' => TourEvent::OWNER_TENANT,
                'tenant_id' => $tenant->id,
            ], [
                ['nombre' => $nombre, 'tipo' => 'auspiciador'],
                ['nombre' => 'DJ Local', 'tipo' => 'artista'],
            ]);
        }
    }
}
