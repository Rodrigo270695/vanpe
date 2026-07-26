<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_catalog_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->uuid('catalog_item_id');
            $table->string('catalog_type', 20);
            $table->timestampsTz();

            $table->unique(['customer_id', 'catalog_item_id']);
            $table->index(['customer_id', 'catalog_type']);
            $table->foreign('catalog_item_id')
                ->references('id')
                ->on('ref_catalog_items')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_catalog_preferences');
    }
};
