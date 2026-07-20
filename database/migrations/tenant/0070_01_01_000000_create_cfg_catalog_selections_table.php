<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cfg_catalog_selections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('catalog_item_id');
            $table->string('catalog_type', 20);
            $table->timestampsTz();

            $table->unique('catalog_item_id');
            $table->index('catalog_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cfg_catalog_selections');
    }
};
