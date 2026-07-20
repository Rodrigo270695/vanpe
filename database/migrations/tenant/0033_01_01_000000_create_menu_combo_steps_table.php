<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_combo_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('combo_dish_id')->constrained('menu_dishes')->cascadeOnDelete();

            $table->string('name', 80);
            $table->string('slug', 30);
            $table->unsignedSmallInteger('min_picks')->default(1);
            $table->unsignedSmallInteger('max_picks')->default(1);
            $table->unsignedSmallInteger('included_picks')->default(1);
            $table->decimal('extra_pick_price', 10, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->unique(['combo_dish_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_combo_steps');
    }
};
