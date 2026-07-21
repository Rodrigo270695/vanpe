<?php

namespace Database\Seeders;

use App\Models\RefCatalogItem;
use App\Support\RefCatalogTypes;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RefCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            RefCatalogTypes::CUISINE => [
                'Cebichería', 'Chifa', 'Criollo', 'Parrilla', 'Mariscos', 'Pollería',
                'Pizza y pasta', 'Comida rápida', 'Vegetariano / vegano', 'Fusión',
                'Cafetería', 'Postres y repostería', 'Anticuchos y sanguches',
            ],
            RefCatalogTypes::SERVICE => [
                'WiFi gratis', 'Delivery', 'Para llevar', 'Estacionamiento',
                'Terraza', 'Aire acondicionado', 'Música en vivo', 'Reservas en línea',
                'Acceso para silla de ruedas', 'Zona para niños', 'Pet friendly',
                'Pago con tarjeta', 'Yape / Plin',
            ],
            RefCatalogTypes::LANGUAGE => [
                'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Quechua',
            ],
            RefCatalogTypes::AMBIANCE => [
                'Urbano', 'Campestre', 'Vista al mar', 'Romántico', 'Familiar',
                'Casual', 'Gourmet / fine dining', 'Tradicional', 'Turístico', 'Rooftop',
            ],
            RefCatalogTypes::TOUR_ACCESS => [
                'A pie', 'Auto', 'Moto', 'Bicicleta', 'Transporte público',
                'Taxi / colectivo', '4x4', 'Lancha',
            ],
            RefCatalogTypes::TOUR_ROAD => [
                'Asfaltado', 'Afirmado', 'Trocha', 'Sendero peatonal', 'Escaleras', 'Mixto',
            ],
        ];

        foreach ($catalog as $type => $names) {
            foreach ($names as $index => $name) {
                $slug = Str::slug($name);

                RefCatalogItem::query()->updateOrCreate(
                    ['type' => $type, 'slug' => $slug],
                    [
                        'name_es' => $name,
                        'name_en' => $this->englishName($type, $name),
                        'sort_order' => $index + 1,
                        'active' => true,
                    ],
                );
            }
        }

        $this->command?->info('Catálogo turístico sembrado.');
    }

    private function englishName(string $type, string $nameEs): string
    {
        $map = [
            'Cebichería' => 'Ceviche restaurant',
            'Chifa' => 'Chinese-Peruvian',
            'Criollo' => 'Peruvian creole',
            'Parrilla' => 'Grill / barbecue',
            'Mariscos' => 'Seafood',
            'Pollería' => 'Rotisserie chicken',
            'Pizza y pasta' => 'Pizza & pasta',
            'Comida rápida' => 'Fast food',
            'Vegetariano / vegano' => 'Vegetarian / vegan',
            'Fusión' => 'Fusion',
            'Cafetería' => 'Café',
            'Postres y repostería' => 'Desserts & bakery',
            'Anticuchos y sanguches' => 'Street food & sandwiches',
            'WiFi gratis' => 'Free WiFi',
            'Delivery' => 'Delivery',
            'Para llevar' => 'Takeaway',
            'Estacionamiento' => 'Parking',
            'Terraza' => 'Terrace',
            'Aire acondicionado' => 'Air conditioning',
            'Música en vivo' => 'Live music',
            'Reservas en línea' => 'Online booking',
            'Acceso para silla de ruedas' => 'Wheelchair access',
            'Zona para niños' => 'Kids area',
            'Pet friendly' => 'Pet friendly',
            'Pago con tarjeta' => 'Card payment',
            'Yape / Plin' => 'Mobile payment (Yape/Plin)',
            'Español' => 'Spanish',
            'Inglés' => 'English',
            'Portugués' => 'Portuguese',
            'Francés' => 'French',
            'Alemán' => 'German',
            'Italiano' => 'Italian',
            'Quechua' => 'Quechua',
            'Urbano' => 'Urban',
            'Campestre' => 'Countryside',
            'Vista al mar' => 'Sea view',
            'Romántico' => 'Romantic',
            'Familiar' => 'Family-friendly',
            'Casual' => 'Casual',
            'Gourmet / fine dining' => 'Fine dining',
            'Tradicional' => 'Traditional',
            'Turístico' => 'Tourist-friendly',
            'Rooftop' => 'Rooftop',
            'A pie' => 'On foot',
            'Auto' => 'Car',
            'Moto' => 'Motorcycle',
            'Bicicleta' => 'Bicycle',
            'Transporte público' => 'Public transport',
            'Taxi / colectivo' => 'Taxi / shared van',
            '4x4' => '4x4',
            'Lancha' => 'Boat',
            'Asfaltado' => 'Paved road',
            'Afirmado' => 'Gravel road',
            'Trocha' => 'Dirt track',
            'Sendero peatonal' => 'Hiking trail',
            'Escaleras' => 'Stairs',
            'Mixto' => 'Mixed',
        ];

        return $map[$nameEs] ?? $nameEs;
    }
}
