<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();

            // restaurant | tour_spot
            $table->string('target_type', 30);
            $table->uuid('target_id');

            $table->unsignedTinyInteger('rating');
            $table->string('titulo', 120)->nullable();
            $table->text('comentario')->nullable();

            $table->timestampsTz();

            $table->unique(['customer_id', 'target_type', 'target_id']);
            $table->index(['target_type', 'target_id']);
            $table->index(['target_type', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_reviews');
    }
};
