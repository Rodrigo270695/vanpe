<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('tenant')->table('menu_dishes', function (Blueprint $table): void {
            $table->boolean('includes_menu_addons')->default(false)->after('featured');
            $table->boolean('includes_drink_in_price')->default(false)->after('includes_menu_addons');
        });

        if (Schema::connection('tenant')->hasColumn('menu_categories', 'menu_role')) {
            DB::connection('tenant')->statement("
                UPDATE menu_dishes d
                SET includes_menu_addons = true
                FROM menu_categories c
                WHERE d.category_id = c.id AND c.menu_role = 'segundo'
            ");
        }

        if (Schema::connection('tenant')->hasTable('cfg_settings')) {
            $includesDrink = DB::connection('tenant')
                ->table('cfg_settings')
                ->value('daily_menu_includes_drink');

            if ($includesDrink) {
                DB::connection('tenant')->statement('
                    UPDATE menu_dishes
                    SET includes_drink_in_price = true
                    WHERE includes_menu_addons = true
                ');
            }
        }
    }

    public function down(): void
    {
        Schema::connection('tenant')->table('menu_dishes', function (Blueprint $table): void {
            $table->dropColumn(['includes_menu_addons', 'includes_drink_in_price']);
        });
    }
};
