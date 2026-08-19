<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pub_restaurant_hours', function (Blueprint $table) {
            $table->boolean('cerrado')->default(false)->after('day_of_week');
        });
    }

    public function down(): void
    {
        Schema::table('pub_restaurant_hours', function (Blueprint $table) {
            $table->dropColumn('cerrado');
        });
    }
};
