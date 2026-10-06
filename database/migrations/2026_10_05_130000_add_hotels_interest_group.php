<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Grupo de interés "Hoteles y hospedaje" para el onboarding de gustos de la app.
 * Solo inserta si falta, para no pisar ediciones hechas desde el panel.
 */
return new class extends Migration
{
    private const SLUG = 'hoteles-y-hospedaje';

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
            'name_es' => 'Hoteles y hospedaje',
            'name_en' => 'Hotels & lodging',
            'icon' => 'hoteles',
            'target_entity' => 'hotel',
            'sort_order' => 5,
            'active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $categories = [
            ['hoteles', 'Hoteles', 'Hotels'],
            ['hostales', 'Hostales', 'Hostels'],
            ['alojamiento-campestre', 'Alojamiento campestre', 'Country lodging'],
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
