<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('tenant')->table('menu_dishes', function (Blueprint $table): void {
            $table->boolean('is_drink')->default(false)->after('includes_drink_in_price');
        });
    }

    public function down(): void
    {
        Schema::connection('tenant')->table('menu_dishes', function (Blueprint $table): void {
            $table->dropColumn('is_drink');
        });
    }
};
