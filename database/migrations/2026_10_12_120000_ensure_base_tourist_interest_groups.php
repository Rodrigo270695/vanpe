<?php

use Database\Seeders\TouristInterestSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La app exige los 6 grupos de interés del onboarding de gustos. Si falta alguno
 * (o está inactivo), el turista no puede guardar sus preferencias.
 */
return new class extends Migration
{
    private const REQUIRED_SLUGS = [
        'gastronomia-y-bebidas',
        'turismo-y-cultura',
        'naturaleza-aire-libre',
        'vida-nocturna-diversion',
        'hoteles-y-hospedaje',
        'artesanos-y-emprendimientos',
    ];

    public function up(): void
    {
        $activeCount = DB::table('tourist_interest_groups')
            ->whereIn('slug', self::REQUIRED_SLUGS)
            ->where('active', true)
            ->count();

        if ($activeCount === count(self::REQUIRED_SLUGS)) {
            return;
        }

        (new TouristInterestSeeder)->run();
    }

    public function down(): void
    {
        //
    }
};
