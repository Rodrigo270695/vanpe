<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('tenant')->table('menu_categories', function (Blueprint $table): void {
            $table->string('system_key', 20)->nullable()->after('menu_role');
            $table->boolean('is_system')->default(false)->after('system_key');
            $table->unique('system_key');
        });

        if (Schema::connection('tenant')->hasColumn('menu_categories', 'menu_role')) {
            \Illuminate\Support\Facades\DB::connection('tenant')->table('menu_categories')
                ->where('menu_role', 'segundo')
                ->update(['menu_role' => 'menu']);
        }
    }

    public function down(): void
    {
        Schema::connection('tenant')->table('menu_categories', function (Blueprint $table): void {
            $table->dropUnique(['system_key']);
            $table->dropColumn(['system_key', 'is_system']);
        });
    }
};
