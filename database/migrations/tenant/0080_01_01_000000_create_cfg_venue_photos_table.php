<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cfg_venue_photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('image_url', 500);
            $table->string('caption', 200)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cfg_venue_photos');
    }
};
