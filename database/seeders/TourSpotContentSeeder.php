<?php

namespace Database\Seeders;

use App\Models\Distrito;
use App\Models\TourCategory;
use App\Models\TourSpot;
use App\Services\Platform\TourSpotWriter;
use Illuminate\Database\Seeder;

/**
 * Centros turísticos reales de Lambayeque / Chiclayo (datos públicos conocidos).
 */
class TourSpotContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TourCategorySeeder::class,
            LambayequeGeoSeeder::class,
        ]);

        $this->ensureRequiredCategories();

        /** @var TourSpotWriter $writer */
        $writer = app(TourSpotWriter::class);

        $categories = TourCategory::query()->pluck('id', 'slug');
        $districts = $this->resolveDistricts();

        $created = 0;
        $skipped = 0;

        foreach ($this->spots() as $spot) {
            $distritoId = $districts[$spot['distrito']] ?? null;

            if ($distritoId === null) {
                $this->command?->warn("Distrito no encontrado: {$spot['distrito']} — se omite {$spot['nombre']}");
                $skipped++;

                continue;
            }

            $categoryIds = collect($spot['categories'])
                ->map(fn (string $slug) => $categories->get($slug))
                ->filter()
                ->values()
                ->all();

            if ($categoryIds === []) {
                // Último recurso: crea la categoría primaria faltante y reintenta.
                foreach ($spot['categories'] as $slug) {
                    $this->ensureCategorySlug($slug);
                }
                $categories = TourCategory::query()->pluck('id', 'slug');
                $categoryIds = collect($spot['categories'])
                    ->map(fn (string $slug) => $categories->get($slug))
                    ->filter()
                    ->values()
                    ->all();
            }

            if ($categoryIds === []) {
                $this->command?->warn("Sin categorías para {$spot['nombre']}");
                $skipped++;

                continue;
            }

            $payload = [
                'distrito_id' => $distritoId,
                'nombre' => $spot['nombre'],
                'slug' => $spot['slug'],
                'resumen' => $spot['resumen'],
                'descripcion' => $spot['descripcion'],
                'direccion' => $spot['direccion'],
                'referencia' => $spot['referencia'] ?? null,
                'latitud' => $spot['latitud'],
                'longitud' => $spot['longitud'],
                'telefono' => $spot['telefono'] ?? null,
                'website' => $spot['website'] ?? null,
                'es_gratuito' => $spot['es_gratuito'],
                'precio_entrada_desde' => $spot['precio_entrada_desde'] ?? null,
                'precio_entrada_hasta' => $spot['precio_entrada_hasta'] ?? null,
                'requiere_reserva' => $spot['requiere_reserva'] ?? false,
                'dificultad_acceso' => $spot['dificultad_acceso'] ?? 'facil',
                'estacionamiento' => $spot['estacionamiento'] ?? 'calle',
                'duracion_visita_min' => $spot['duracion_visita_min'] ?? null,
                'horario_texto' => $spot['horario_texto'] ?? null,
                'mejor_epoca' => $spot['mejor_epoca'] ?? null,
                'tips' => $spot['tips'] ?? null,
                'destacado' => $spot['destacado'] ?? false,
                'estado' => TourSpot::ESTADO_PUBLICADO,
                'category_ids' => $categoryIds,
                'primary_category_id' => $categoryIds[0],
                'hours' => $spot['hours'] ?? null,
            ];

            $existing = TourSpot::withTrashed()->where('slug', $spot['slug'])->first();

            if ($existing !== null) {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $model = $writer->update($existing, $payload);
            } else {
                $model = $writer->create($payload);
            }

            $model->update([
                'como_llegar' => $spot['como_llegar'] ?? null,
            ]);
            $created++;
        }

        $this->command?->info("Centros turísticos reales: {$created} listos".($skipped > 0 ? ", {$skipped} omitidos" : '').'.');
    }

    private function ensureRequiredCategories(): void
    {
        $required = [
            'religioso', 'arqueologico', 'museo', 'playa', 'naturaleza',
            'mirador', 'gastronomico', 'historico-urbano', 'aventura', 'cultural-vivo',
        ];

        foreach ($required as $slug) {
            $this->ensureCategorySlug($slug);
        }
    }

    private function ensureCategorySlug(string $slug): void
    {
        $labels = [
            'religioso' => ['Religioso', 'Religious', 'church', '#7C3AED'],
            'arqueologico' => ['Arqueológico', 'Archaeological', 'landmark', '#B45309'],
            'museo' => ['Museo', 'Museum', 'building-2', '#1D4ED8'],
            'playa' => ['Playa', 'Beach', 'waves', '#0891B2'],
            'naturaleza' => ['Naturaleza', 'Nature', 'trees', '#15803D'],
            'mirador' => ['Mirador', 'Viewpoint', 'mountain', '#0F766E'],
            'gastronomico' => ['Gastronómico', 'Food & markets', 'utensils', '#C2410C'],
            'historico-urbano' => ['Histórico urbano', 'Urban heritage', 'map-pinned', '#475569'],
            'aventura' => ['Aventura', 'Adventure', 'compass', '#DC2626'],
            'cultural-vivo' => ['Cultural vivo', 'Living culture', 'sparkles', '#DB2777'],
        ];

        $meta = $labels[$slug] ?? [ucfirst($slug), ucfirst($slug), 'map-pin', '#64748B'];

        TourCategory::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'name_es' => $meta[0],
                'name_en' => $meta[1],
                'icon' => $meta[2],
                'color_hex' => $meta[3],
                'sort_order' => 99,
                'active' => true,
            ],
        );
    }

    /**
     * @return array<string, int>
     */
    private function resolveDistricts(): array
    {
        $names = [
            'CHICLAYO',
            'LAMBAYEQUE',
            'TÚCUME',
            'PIMENTEL',
            'MONSEFÚ',
            'FERREÑAFE',
            'ZAÑA',
        ];

        $all = Distrito::query()->get(['id', 'name']);
        $byFold = [];

        foreach ($all as $distrito) {
            $byFold[$this->fold($distrito->name)] = (int) $distrito->id;
        }

        $map = [];

        foreach ($names as $name) {
            $id = $byFold[$this->fold($name)] ?? null;

            if ($id !== null) {
                $map[$name] = $id;
            }
        }

        // Fallback ZAÑA → CHICLAYO si no existe el distrito
        if (! isset($map['ZAÑA']) && isset($map['CHICLAYO'])) {
            $map['ZAÑA'] = $map['CHICLAYO'];
        }

        if (! isset($map['FERREÑAFE']) && isset($map['LAMBAYEQUE'])) {
            $map['FERREÑAFE'] = $map['LAMBAYEQUE'];
        }

        return $map;
    }

    private function fold(string $value): string
    {
        $value = mb_strtoupper(trim($value), 'UTF-8');
        $from = ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'];
        $to = ['A', 'E', 'I', 'O', 'U', 'U', 'N'];

        return str_replace($from, $to, $value);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function spots(): array
    {
        $weekOpen = $this->hours('09:00', '17:00');
        $cathedralHours = $this->hours('07:00', '20:00');

        return [
            [
                'slug' => 'museo-tumbas-reales-sipan',
                'nombre' => 'Museo Tumbas Reales de Sipán',
                'distrito' => 'LAMBAYEQUE',
                'categories' => ['museo', 'arqueologico'],
                'resumen' => 'Museo que exhibe el ajuar funerario del Señor de Sipán, hallazgo arqueológico de renombre mundial.',
                'descripcion' => 'Inaugurado en 2002 en la ciudad de Lambayeque, el Museo Tumbas Reales de Sipán presenta la tumba del Señor de Sipán y piezas de la cultura Mochica recuperadas en Huaca Rajada. Es uno de los museos más visitados del norte del Perú.',
                'direccion' => 'Av. Juan Pablo Vizcardo y Guzmán s/n, Lambayeque',
                'referencia' => 'A unos minutos del centro de Lambayeque',
                'latitud' => -6.7048,
                'longitud' => -79.9062,
                'telefono' => '+51 74 283977',
                'website' => 'https://www.museotumbasrealessipan.pe',
                'es_gratuito' => false,
                'precio_entrada_desde' => 15,
                'precio_entrada_hasta' => 40,
                'requiere_reserva' => false,
                'duracion_visita_min' => 120,
                'horario_texto' => 'Martes a domingo, 9:00–17:00 (verificar feriados)',
                'mejor_epoca' => 'Todo el año',
                'estacionamiento' => 'privado_pago',
                'destacado' => true,
                'tips' => ['es' => ['Llega temprano los fines de semana', 'Hay audioguías y visitas guiadas', 'Combínalo con el Museo Brüning']],
                'como_llegar' => ['es' => 'Desde Chiclayo toma combi o taxi hacia Lambayeque (aprox. 20–30 min). El museo está señalizado en la avenida principal.'],
                'hours' => $weekOpen,
            ],
            [
                'slug' => 'huaca-rajada-sipan',
                'nombre' => 'Huaca Rajada – Sipán',
                'distrito' => 'ZAÑA',
                'categories' => ['arqueologico'],
                'resumen' => 'Sitio arqueológico donde se descubrió la tumba del Señor de Sipán en 1987.',
                'descripcion' => 'Complejo funerario Moche en el distrito de Sipán/Zaña. Incluye el museo de sitio y las plataformas donde se excavaron las tumbas reales. Complementa la visita al Museo Tumbas Reales.',
                'direccion' => 'Centro poblado Sipán, provincia de Chiclayo',
                'latitud' => -6.8095,
                'longitud' => -79.6018,
                'es_gratuito' => false,
                'precio_entrada_desde' => 8,
                'precio_entrada_hasta' => 15,
                'duracion_visita_min' => 90,
                'horario_texto' => 'Martes a domingo, 9:00–16:30',
                'mejor_epoca' => 'Abril a diciembre (menos calor extremo)',
                'estacionamiento' => 'calle',
                'destacado' => true,
                'tips' => ['es' => ['Lleva agua y protector solar', 'Combina con el museo de Lambayeque el mismo día']],
                'como_llegar' => ['es' => 'Desde Chiclayo hay colectivos hacia Sipán/Zaña. El trayecto toma alrededor de 45 minutos.'],
                'hours' => $weekOpen,
            ],
            [
                'slug' => 'piramides-de-tucume',
                'nombre' => 'Pirámides de Túcume',
                'distrito' => 'TÚCUME',
                'categories' => ['arqueologico', 'mirador'],
                'resumen' => 'Valle de las Pirámides: más de veinte huacas de adobe de las culturas Lambayeque, Chimú e Inca.',
                'descripcion' => 'El complejo arqueológico de Túcume reúne pirámides truncadas de adobe en el norte de Lambayeque. Incluye museo de sitio y miradores hacia el Cerro La Raya.',
                'direccion' => 'Complejo Arqueológico Túcume, Túcume',
                'latitud' => -6.5089,
                'longitud' => -79.8445,
                'telefono' => '+51 74 412026',
                'es_gratuito' => false,
                'precio_entrada_desde' => 10,
                'precio_entrada_hasta' => 20,
                'duracion_visita_min' => 150,
                'horario_texto' => 'Martes a domingo, 8:00–16:30',
                'mejor_epoca' => 'Mañanas secas de mayo a noviembre',
                'estacionamiento' => 'privado_gratis',
                'dificultad_acceso' => 'moderado',
                'destacado' => true,
                'tips' => ['es' => ['Sube al mirador temprano', 'Usa calzado cómodo para el sendero']],
                'como_llegar' => ['es' => 'Desde Chiclayo o Lambayeque toma transporte hacia Túcume. El ingreso al complejo está señalizado.'],
                'hours' => $this->hours('08:00', '16:30'),
            ],
            [
                'slug' => 'museo-nacional-sican',
                'nombre' => 'Museo Nacional Sicán',
                'distrito' => 'FERREÑAFE',
                'categories' => ['museo', 'arqueologico'],
                'resumen' => 'Museo dedicado a la cultura Sicán (Lambayeque), con oro, cerámica y hallazgos de Batán Grande.',
                'descripcion' => 'Ubicado en Ferreñafe, el Museo Nacional Sicán interpreta la cultura Sicán y el patrimonio del Santuario Histórico Bosque de Pómac / Batán Grande.',
                'direccion' => 'Av. Batán Grande cuadra 9, Ferreñafe',
                'latitud' => -6.6402,
                'longitud' => -79.7885,
                'es_gratuito' => false,
                'precio_entrada_desde' => 8,
                'precio_entrada_hasta' => 15,
                'duracion_visita_min' => 90,
                'horario_texto' => 'Martes a domingo, 9:00–17:00',
                'estacionamiento' => 'calle',
                'destacado' => false,
                'tips' => ['es' => ['Ideal para combinar con Bosque de Pómac']],
                'como_llegar' => ['es' => 'Desde Chiclayo toma bus o combi a Ferreñafe (aprox. 30–40 min).'],
                'hours' => $weekOpen,
            ],
            [
                'slug' => 'catedral-de-chiclayo',
                'nombre' => 'Catedral de Chiclayo',
                'distrito' => 'CHICLAYO',
                'categories' => ['religioso', 'historico-urbano'],
                'resumen' => 'Catedral neoclásica en la Plaza de Armas, símbolo del centro histórico de Chiclayo.',
                'descripcion' => 'La Catedral Santa María de Chiclayo preside la Plaza de Armas. Es punto de partida habitual para recorrer el centro, el Mercado Modelo y la vida urbana chiclayana.',
                'direccion' => 'Plaza de Armas, Chiclayo',
                'latitud' => -6.7714,
                'longitud' => -79.8409,
                'es_gratuito' => true,
                'duracion_visita_min' => 40,
                'horario_texto' => 'Misas y visitas diarias; consulta horarios parroquiales',
                'estacionamiento' => 'calle',
                'destacado' => true,
                'tips' => ['es' => ['Visita al atardecer para fotos de la plaza', 'Respeta los horarios de misa']],
                'como_llegar' => ['es' => 'En el corazón del centro de Chiclayo; accesible a pie desde la mayoría de hoteles céntricos.'],
                'hours' => $cathedralHours,
            ],
            [
                'slug' => 'playa-pimentel',
                'nombre' => 'Playa Pimentel',
                'distrito' => 'PIMENTEL',
                'categories' => ['playa', 'gastronomico'],
                'resumen' => 'Balneario del litoral chiclayano con malecón, muelle y cevicherías frente al mar.',
                'descripcion' => 'Pimentel es el balneario más visitado cerca de Chiclayo. Destacan el malecón, el muelle y la oferta de mariscos. Ideal para atardeceres y paseos en familia.',
                'direccion' => 'Malecón de Pimentel, Pimentel',
                'latitud' => -6.8355,
                'longitud' => -79.9342,
                'es_gratuito' => true,
                'duracion_visita_min' => 180,
                'horario_texto' => 'Acceso libre todo el día',
                'mejor_epoca' => 'Diciembre a abril (temporada de playa)',
                'estacionamiento' => 'calle',
                'destacado' => true,
                'tips' => ['es' => ['Prueba un ceviche en el malecón', 'Lleva protector solar y efectivo']],
                'como_llegar' => ['es' => 'Desde Chiclayo hay combis y taxis frecuentes hacia Pimentel (15–25 min).'],
                'hours' => null,
            ],
            [
                'slug' => 'mercado-modelo-chiclayo',
                'nombre' => 'Mercado Modelo de Chiclayo',
                'distrito' => 'CHICLAYO',
                'categories' => ['gastronomico', 'cultural-vivo'],
                'resumen' => 'Mercado emblemático de Chiclayo: frutas, artesanía, hierbas y comida norteña.',
                'descripcion' => 'El Mercado Modelo es un clásico del turismo gastronómico y cultural en Chiclayo. Aquí se consiguen productos locales, artesanía y puestos de comida típica.',
                'direccion' => 'Av. Balta / zona Mercado Modelo, Chiclayo',
                'latitud' => -6.7678,
                'longitud' => -79.8375,
                'es_gratuito' => true,
                'duracion_visita_min' => 75,
                'horario_texto' => 'Todos los días desde temprano hasta la tarde',
                'estacionamiento' => 'calle',
                'destacado' => false,
                'tips' => ['es' => ['Cuida tus pertenencias en horas punta', 'Pregunta por el king kong y el chifles']],
                'como_llegar' => ['es' => 'A pocas cuadras de la Plaza de Armas; fácilmente caminable o en taxi corto.'],
                'hours' => $this->hours('06:00', '18:00'),
            ],
            [
                'slug' => 'monsefu-artesanias',
                'nombre' => 'Monsefú – pueblo artesanal',
                'distrito' => 'MONSEFÚ',
                'categories' => ['cultural-vivo', 'gastronomico'],
                'resumen' => 'Capital de la artesanía lambayecana: tejidos, sombreros y dulces típicos.',
                'descripcion' => 'Monsefú es conocido por su tradición artesanal (tejidos, sombreros de junco) y por su gastronomía. Ideal para una escapada corta desde Chiclayo.',
                'direccion' => 'Plaza de Armas de Monsefú',
                'latitud' => -6.8772,
                'longitud' => -79.8721,
                'es_gratuito' => true,
                'duracion_visita_min' => 120,
                'horario_texto' => 'Visita diurna recomendada',
                'estacionamiento' => 'calle',
                'destacado' => false,
                'tips' => ['es' => ['Compra artesanía directamente a talleres', 'Prueba dulces locales']],
                'como_llegar' => ['es' => 'Combis frecuentes desde el terminal / paraderos de Chiclayo hacia Monsefú.'],
                'hours' => null,
            ],
            [
                'slug' => 'bosque-de-pomac',
                'nombre' => 'Santuario Histórico Bosque de Pómac',
                'distrito' => 'FERREÑAFE',
                'categories' => ['naturaleza', 'arqueologico'],
                'resumen' => 'Bosque seco con algarrobos milenarios y restos arqueológicos Sicán en Batán Grande.',
                'descripcion' => 'Área natural protegida con el famoso algarrobo milenario, fauna del bosque seco ecuatorial y vestigios de la cultura Sicán. Perfecto para ecoturismo y fotografía.',
                'direccion' => 'Batán Grande / Bosque de Pómac, Ferreñafe',
                'latitud' => -6.5265,
                'longitud' => -79.7752,
                'es_gratuito' => false,
                'precio_entrada_desde' => 10,
                'precio_entrada_hasta' => 20,
                'duracion_visita_min' => 180,
                'horario_texto' => 'Ingreso diurno; consulta con SERNANP / operadores locales',
                'mejor_epoca' => 'Mayo a noviembre',
                'estacionamiento' => 'privado_gratis',
                'dificultad_acceso' => 'moderado',
                'destacado' => true,
                'tips' => ['es' => ['Contrata guía local', 'Lleva agua y ropa ligera de manga larga']],
                'como_llegar' => ['es' => 'Se accede desde Ferreñafe / Batán Grande; conviene taxi o tour organizado desde Chiclayo.'],
                'hours' => $this->hours('08:00', '16:00'),
            ],
        ];
    }

    /**
     * @return list<array{day_of_week: int, active: bool, opens_at: string|null, closes_at: string|null}>
     */
    private function hours(string $opens, string $closes): array
    {
        $rows = [];

        for ($day = 0; $day <= 6; $day++) {
            $active = $day !== 1; // lunes cerrado (común en museos)
            $rows[] = [
                'day_of_week' => $day,
                'active' => $active,
                'opens_at' => $active ? $opens : null,
                'closes_at' => $active ? $closes : null,
            ];
        }

        return $rows;
    }
}
