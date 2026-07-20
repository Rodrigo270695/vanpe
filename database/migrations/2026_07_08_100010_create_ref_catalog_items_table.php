<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ref_catalog_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 20);
            $table->string('slug', 80);
            $table->string('name_es', 100);
            $table->string('name_en', 100);
            $table->string('icon', 40)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestampsTz();

            $table->unique(['type', 'slug']);
            $table->index(['type', 'active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ref_catalog_items');
    }
};
