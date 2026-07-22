<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_spot_inclusions', function (Blueprint $table) {
            $table->foreignUuid('tour_spot_id')->constrained('tour_spots')->cascadeOnDelete();
            $table->foreignUuid('ref_catalog_item_id')->constrained('ref_catalog_items')->restrictOnDelete();
            $table->primary(['tour_spot_id', 'ref_catalog_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_spot_inclusions');
    }
};
