<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_combo_step_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('step_id')->constrained('menu_combo_steps')->cascadeOnDelete();
            $table->foreignUuid('dish_id')->constrained('menu_dishes')->cascadeOnDelete();

            $table->decimal('supplement', 10, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->unique(['step_id', 'dish_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_combo_step_options');
    }
};
