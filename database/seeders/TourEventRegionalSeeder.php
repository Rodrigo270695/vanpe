<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\TourEvent;
use App\Services\Platform\TourEventWriter;
use Illuminate\Database\Seeder;

/**
 * Festividades regionales de Lambayeque (plataforma).
 */
class TourEventRegionalSeeder extends Seeder
{
    public function run(): void
    {
        $writer = app(TourEventWriter::class);
        $lambayeque = Departamento::query()->where('name', 'like', '%Lambayeque%')->value('id');

        $samples = [
            [
                'titulo' => 'Fiesta de la Cruz de Motupe',
                'slug' => 'cruz-de-motupe',
                'resumen' => 'Peregrinación y fiesta religiosa en Motupe, Lambayeque.',
                'descripcion' => "Una de las festividades más importantes del norte peruano.\nProcesión, feria, gastronomía y música tradicional.",
                'lugar' => 'Motupe, Lambayeque',
                'portada_url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
                'starts_at' => now('America/Lima')->addMonths(1)->startOfDay(),
                'ends_at' => now('America/Lima')->addMonths(1)->addDays(3)->endOfDay(),
                'sort_order' => 1,
                'sponsors' => [
                    ['nombre' => 'Municipalidad de Motupe', 'tipo' => 'auspiciador'],
                    ['nombre' => 'Orquesta Los Destellos', 'tipo' => 'orquesta'],
                ],
            ],
            [
                'titulo' => 'Fexticum Monsefú',
                'slug' => 'fexticum-monsefu',
                'resumen' => 'Festival de arte, cultura y tradición monsefuana.',
                'descripcion' => "Feria de artesanía, danzas, gastronomía y concursos.\nReferente cultural de Lambayeque.",
                'lugar' => 'Monsefú, Lambayeque',
                'portada_url' => 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
                'starts_at' => now('America/Lima')->addMonths(2)->startOfDay(),
                'ends_at' => now('America/Lima')->addMonths(2)->addDays(5)->endOfDay(),
                'sort_order' => 2,
                'sponsors' => [
                    ['nombre' => 'Gobierno Regional Lambayeque', 'tipo' => 'auspiciador'],
                    ['nombre' => 'Orquesta Armonía', 'tipo' => 'orquesta'],
                ],
            ],
        ];

        foreach ($samples as $sample) {
            $sponsors = $sample['sponsors'];
            unset($sample['sponsors']);

            if (TourEvent::query()->where('slug', $sample['slug'])->exists()) {
                continue;
            }

            $writer->create([
                ...$sample,
                'departamento_id' => $lambayeque,
                'estado' => TourEvent::ESTADO_PUBLICADO,
                'destacado' => true,
                'owner_type' => TourEvent::OWNER_PLATFORM,
            ], $sponsors);
        }
    }
}
