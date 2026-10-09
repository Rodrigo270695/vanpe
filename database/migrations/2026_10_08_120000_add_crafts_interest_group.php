<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Grupo de interés "Artesanos y emprendimientos" para el onboarding de gustos de la app.
 * Solo inserta si falta, para no pisar ediciones hechas desde el panel.
 */
return new class extends Migration
{
    private const SLUG = 'artesanos-y-emprendimientos';

    public function up(): void
    {
        if (DB::table('tourist_interest_groups')->where('slug', self::SLUG)->exists()) {
            return;
        }

        $now = now();
        $groupId = (string) Str::uuid();

        DB::table('tourist_interest_groups')->insert([
            'id' => $groupId,
            'slug' => self::SLUG,
            'name_es' => 'Artesanos y emprendimientos',
            'name_en' => 'Artisans & small businesses',
            'icon' => 'artesanos',
            'target_entity' => 'craft',
            'sort_order' => 6,
            'active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $categories = [
            ['artesania', 'Artesanía', 'Handicrafts'],
            ['textiles', 'Textiles y tejidos', 'Textiles & weaving'],
            ['emprendimientos-locales', 'Emprendimientos locales', 'Local businesses'],
        ];

        foreach ($categories as $index => [$slug, $nameEs, $nameEn]) {
            DB::table('tourist_interest_categories')->insert([
                'id' => (string) Str::uuid(),
                'group_id' => $groupId,
                'slug' => $slug,
                'name_es' => $nameEs,
                'name_en' => $nameEn,
                'sort_order' => $index + 1,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('tourist_interest_groups')->where('slug', self::SLUG)->delete();
    }
};
