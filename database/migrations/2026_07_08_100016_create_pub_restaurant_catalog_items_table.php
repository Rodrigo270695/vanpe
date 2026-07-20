<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pub_restaurant_catalog_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->uuid('catalog_item_id');
            $table->string('catalog_type', 20);
            $table->string('slug', 80);
            $table->string('name_es', 120);
            $table->string('name_en', 120);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'catalog_item_id']);
            $table->index(['tenant_id', 'catalog_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pub_restaurant_catalog_items');
    }
};
