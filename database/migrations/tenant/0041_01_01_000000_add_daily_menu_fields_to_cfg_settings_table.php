<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->boolean('daily_menu_enabled')->default(true)->after('auto_publish');
            $table->decimal('daily_menu_price', 10, 2)->default(12)->after('daily_menu_enabled');
            $table->decimal('daily_menu_extra_entrada_price', 10, 2)->default(5)->after('daily_menu_price');
            $table->boolean('daily_menu_includes_drink')->default(true)->after('daily_menu_extra_entrada_price');
        });
    }

    public function down(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->dropColumn([
                'daily_menu_enabled',
                'daily_menu_price',
                'daily_menu_extra_entrada_price',
                'daily_menu_includes_drink',
            ]);
        });
    }
};
