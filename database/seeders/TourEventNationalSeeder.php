<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\TourEvent;
use App\Services\Platform\TourEventWriter;
use Illuminate\Database\Seeder;

/**
 * Festividades nacionales / cívicas (plataforma).
 */
class TourEventNationalSeeder extends Seeder
{
    public function run(): void
    {
        $writer = app(TourEventWriter::class);
        $lambayeque = Departamento::query()->where('name', 'like', '%Lambayeque%')->value('id');
        $year = (int) now('America/Lima')->year;

        if (TourEvent::query()->where('slug', 'fiestas-patrias-chiclayo')->exists()) {
            return;
        }

        $writer->create([
            'titulo' => 'Fiestas Patrias en Chiclayo',
            'slug' => 'fiestas-patrias-chiclayo',
            'resumen' => 'Celebración del 28 y 29 de julio con actividades cívicas y ferias.',
            'descripcion' => 'Desfiles, ferias gastronómicas y shows musicales en la ciudad.',
            'lugar' => 'Chiclayo',
            'portada_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            'starts_at' => now('America/Lima')->setDate($year, 7, 27)->startOfDay(),
            'ends_at' => now('America/Lima')->setDate($year, 7, 29)->endOfDay(),
            'departamento_id' => $lambayeque,
            'estado' => TourEvent::ESTADO_PUBLICADO,
            'destacado' => true,
            'sort_order' => 3,
            'owner_type' => TourEvent::OWNER_PLATFORM,
        ], [
            ['nombre' => 'Municipalidad de Chiclayo', 'tipo' => 'auspiciador'],
        ]);
    }
}
