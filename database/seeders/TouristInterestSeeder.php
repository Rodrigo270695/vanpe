<?php

namespace Database\Seeders;

use App\Models\RefCatalogItem;
use App\Models\TourCategory;
use App\Models\TouristInterestCategory;
use App\Models\TouristInterestGroup;
use App\Support\RefCatalogTypes;
use Illuminate\Database\Seeder;

class TouristInterestSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [
                'slug' => 'gastronomia-y-bebidas',
                'name_es' => 'Gastronomía y bebidas',
                'name_en' => 'Food & drinks',
                'icon' => 'gastronomia',
                'target_entity' => TouristInterestGroup::TARGET_RESTAURANT,
                'sort_order' => 1,
                'categories' => [
                    [
                        'slug' => 'restaurante-criollo',
                        'name_es' => 'Restaurante criollo',
                        'name_en' => 'Creole restaurant',
                        'catalog' => [[RefCatalogTypes::CUISINE, 'criollo']],
                    ],
                    [
                        'slug' => 'recreo-campestre',
                        'name_es' => 'Recreo campestre',
                        'name_en' => 'Countryside recreation',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'campestre'],
                            [RefCatalogTypes::SERVICE, 'terraza'],
                        ],
                    ],
                    [
                        'slug' => 'picanteria-cevicheria',
                        'name_es' => 'Picantería / cevichería',
                        'name_en' => 'Ceviche house',
                        'catalog' => [[RefCatalogTypes::CUISINE, 'cebicheria']],
                    ],
                    [
                        'slug' => 'cafes-postres',
                        'name_es' => 'Cafés y postres',
                        'name_en' => 'Cafés & desserts',
                        'catalog' => [
                            [RefCatalogTypes::CUISINE, 'cafeteria'],
                            [RefCatalogTypes::CUISINE, 'postres-y-reposteria'],
                        ],
                    ],
                    [
                        'slug' => 'chifa-fusion',
                        'name_es' => 'Chifa / comida fusión',
                        'name_en' => 'Chifa / fusion',
                        'catalog' => [
                            [RefCatalogTypes::CUISINE, 'chifa'],
                            [RefCatalogTypes::CUISINE, 'fusion'],
                        ],
                    ],
                    [
                        'slug' => 'comida-al-paso',
                        'name_es' => 'Comida al paso / fast food',
                        'name_en' => 'Street food / fast food',
                        'catalog' => [
                            [RefCatalogTypes::CUISINE, 'comida-rapida'],
                            [RefCatalogTypes::CUISINE, 'anticuchos-y-sanguches'],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'turismo-y-cultura',
                'name_es' => 'Turismo y cultura',
                'name_en' => 'Tourism & culture',
                'icon' => 'turismo',
                'target_entity' => TouristInterestGroup::TARGET_TOUR_SPOT,
                'sort_order' => 2,
                'categories' => [
                    [
                        'slug' => 'arqueologia-historia',
                        'name_es' => 'Arqueología e historia',
                        'name_en' => 'Archaeology & history',
                        'tour' => ['arqueologico'],
                    ],
                    [
                        'slug' => 'patrimonio-museos',
                        'name_es' => 'Patrimonio y museos',
                        'name_en' => 'Heritage & museums',
                        'tour' => ['museo', 'historico-urbano'],
                    ],
                    [
                        'slug' => 'mercados-artesania',
                        'name_es' => 'Mercados y artesanía',
                        'name_en' => 'Markets & crafts',
                        'tour' => ['gastronomico', 'cultural-vivo'],
                    ],
                    [
                        'slug' => 'centros-culturales',
                        'name_es' => 'Centros culturales',
                        'name_en' => 'Cultural centers',
                        'tour' => ['cultural-vivo', 'museo'],
                    ],
                ],
            ],
            [
                'slug' => 'naturaleza-aire-libre',
                'name_es' => 'Naturaleza y aire libre',
                'name_en' => 'Nature & outdoors',
                'icon' => 'naturaleza',
                'target_entity' => TouristInterestGroup::TARGET_RESTAURANT,
                'sort_order' => 3,
                'categories' => [
                    [
                        'slug' => 'playas-balnearios',
                        'name_es' => 'Playas y balnearios',
                        'name_en' => 'Beaches',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'vista-al-mar'],
                            [RefCatalogTypes::CUISINE, 'mariscos'],
                            [RefCatalogTypes::CUISINE, 'cebicheria'],
                        ],
                    ],
                    [
                        'slug' => 'parques-reservas',
                        'name_es' => 'Parques y reservas naturales',
                        'name_en' => 'Parks & nature reserves',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'campestre'],
                            [RefCatalogTypes::AMBIANCE, 'tradicional'],
                        ],
                    ],
                    [
                        'slug' => 'miradores-paisajes',
                        'name_es' => 'Miradores y paisajes',
                        'name_en' => 'Viewpoints & landscapes',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'rooftop'],
                            [RefCatalogTypes::AMBIANCE, 'turistico'],
                        ],
                    ],
                    [
                        'slug' => 'camping-bungalows',
                        'name_es' => 'Camping y bungalows / recreos',
                        'name_en' => 'Camping & lodges',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'campestre'],
                            [RefCatalogTypes::AMBIANCE, 'familiar'],
                        ],
                    ],
                    [
                        'slug' => 'parques-tematicos',
                        'name_es' => 'Parques temáticos',
                        'name_en' => 'Theme parks',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'familiar'],
                            [RefCatalogTypes::AMBIANCE, 'turistico'],
                        ],
                    ],
                    [
                        'slug' => 'deporte-aventura',
                        'name_es' => 'Deporte y aventura',
                        'name_en' => 'Sports & adventure',
                        'catalog' => [
                            [RefCatalogTypes::SERVICE, 'terraza'],
                            [RefCatalogTypes::AMBIANCE, 'casual'],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'vida-nocturna-diversion',
                'name_es' => 'Vida nocturna y diversión',
                'name_en' => 'Nightlife & entertainment',
                'icon' => 'vida-nocturna',
                'target_entity' => TouristInterestGroup::TARGET_RESTAURANT,
                'sort_order' => 4,
                'categories' => [
                    [
                        'slug' => 'video-pub-bar',
                        'name_es' => 'Video pub / bar',
                        'name_en' => 'Sports bar / pub',
                        'catalog' => [
                            [RefCatalogTypes::SERVICE, 'musica-en-vivo'],
                            [RefCatalogTypes::AMBIANCE, 'rooftop'],
                            [RefCatalogTypes::AMBIANCE, 'casual'],
                        ],
                    ],
                    [
                        'slug' => 'discoteca-club',
                        'name_es' => 'Discoteca / club',
                        'name_en' => 'Nightclub',
                        'catalog' => [
                            [RefCatalogTypes::SERVICE, 'musica-en-vivo'],
                            [RefCatalogTypes::AMBIANCE, 'urbano'],
                        ],
                    ],
                    [
                        'slug' => 'pena-criolla',
                        'name_es' => 'Peña criolla',
                        'name_en' => 'Creole peña',
                        'catalog' => [
                            [RefCatalogTypes::AMBIANCE, 'tradicional'],
                            [RefCatalogTypes::SERVICE, 'musica-en-vivo'],
                            [RefCatalogTypes::CUISINE, 'criollo'],
                        ],
                    ],
                    [
                        'slug' => 'karaoke-shows',
                        'name_es' => 'Karaoke y shows',
                        'name_en' => 'Karaoke & shows',
                        'catalog' => [
                            [RefCatalogTypes::SERVICE, 'musica-en-vivo'],
                            [RefCatalogTypes::AMBIANCE, 'familiar'],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($groups as $groupData) {
            $categories = $groupData['categories'];
            unset($groupData['categories']);

            $group = TouristInterestGroup::query()->updateOrCreate(
                ['slug' => $groupData['slug']],
                [
                    ...$groupData,
                    'active' => true,
                ],
            );

            foreach ($categories as $index => $catData) {
                $catalogLinks = $catData['catalog'] ?? [];
                $tourLinks = $catData['tour'] ?? [];
                unset($catData['catalog'], $catData['tour']);

                $category = TouristInterestCategory::query()->updateOrCreate(
                    ['group_id' => $group->id, 'slug' => $catData['slug']],
                    [
                        ...$catData,
                        'sort_order' => $index + 1,
                        'active' => true,
                    ],
                );

                if ($catalogLinks !== []) {
                    $ids = collect($catalogLinks)
                        ->map(fn (array $pair): ?string => $this->catalogId($pair[0], $pair[1]))
                        ->filter()
                        ->unique()
                        ->values()
                        ->all();
                    $category->catalogItems()->sync($ids);
                }

                if ($tourLinks !== []) {
                    $ids = collect($tourLinks)
                        ->map(fn (string $slug): ?string => TourCategory::query()->where('slug', $slug)->value('id'))
                        ->filter()
                        ->unique()
                        ->values()
                        ->all();
                    $category->tourCategories()->sync($ids);
                }
            }
        }

        $this->command?->info('Intereses turistas (macros + amarres) sembrados.');
    }

    private function catalogId(string $type, string $slug): ?string
    {
        return RefCatalogItem::query()
            ->where('type', $type)
            ->where('slug', $slug)
            ->value('id');
    }
}
