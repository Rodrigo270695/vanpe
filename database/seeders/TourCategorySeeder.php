<?php

namespace Database\Seeders;

use App\Models\TourCategory;
use Illuminate\Database\Seeder;

class TourCategorySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['slug' => 'religioso', 'name_es' => 'Religioso', 'name_en' => 'Religious', 'icon' => 'church', 'color_hex' => '#7C3AED', 'sort_order' => 1],
            ['slug' => 'arqueologico', 'name_es' => 'Arqueológico', 'name_en' => 'Archaeological', 'icon' => 'landmark', 'color_hex' => '#B45309', 'sort_order' => 2],
            ['slug' => 'museo', 'name_es' => 'Museo', 'name_en' => 'Museum', 'icon' => 'building-2', 'color_hex' => '#1D4ED8', 'sort_order' => 3],
            ['slug' => 'playa', 'name_es' => 'Playa', 'name_en' => 'Beach', 'icon' => 'waves', 'color_hex' => '#0891B2', 'sort_order' => 4],
            ['slug' => 'naturaleza', 'name_es' => 'Naturaleza', 'name_en' => 'Nature', 'icon' => 'trees', 'color_hex' => '#15803D', 'sort_order' => 5],
            ['slug' => 'mirador', 'name_es' => 'Mirador', 'name_en' => 'Viewpoint', 'icon' => 'mountain', 'color_hex' => '#0F766E', 'sort_order' => 6],
            ['slug' => 'gastronomico', 'name_es' => 'Gastronómico', 'name_en' => 'Food & markets', 'icon' => 'utensils', 'color_hex' => '#C2410C', 'sort_order' => 7],
            ['slug' => 'historico-urbano', 'name_es' => 'Histórico urbano', 'name_en' => 'Urban heritage', 'icon' => 'map-pinned', 'color_hex' => '#475569', 'sort_order' => 8],
            ['slug' => 'aventura', 'name_es' => 'Aventura', 'name_en' => 'Adventure', 'icon' => 'compass', 'color_hex' => '#DC2626', 'sort_order' => 9],
            ['slug' => 'cultural-vivo', 'name_es' => 'Cultural vivo', 'name_en' => 'Living culture', 'icon' => 'sparkles', 'color_hex' => '#DB2777', 'sort_order' => 10],
        ];

        foreach ($rows as $row) {
            TourCategory::query()->updateOrCreate(
                ['slug' => $row['slug']],
                [
                    ...$row,
                    'active' => true,
                ],
            );
        }

        $this->command?->info('Categorías de centros turísticos sembradas.');
    }
}
