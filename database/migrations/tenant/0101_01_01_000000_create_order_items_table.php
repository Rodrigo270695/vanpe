<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('dish_id')->nullable()->constrained('menu_dishes')->nullOnDelete();

            $table->string('name_snapshot', 150);
            $table->decimal('price_snapshot', 10, 2);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('subtotal', 10, 2);

            $table->string('kitchen_status', 15)->default('pending');
            $table->string('notes', 200)->nullable();

            $table->timestampsTz();

            $table->index(['order_id', 'kitchen_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
