<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_selections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_item_id')->constrained('order_items')->cascadeOnDelete();

            $table->string('step_name', 80);
            $table->string('step_slug', 30);
            $table->foreignUuid('dish_id')->nullable()->constrained('menu_dishes')->nullOnDelete();
            $table->string('name_snapshot', 150);
            $table->decimal('extra_price', 10, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestampsTz();

            $table->index('order_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_selections');
    }
};
