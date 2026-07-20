<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cfg_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('currency', 3)->default('PEN');
            $table->decimal('tax_rate', 5, 2)->default(10.50);
            $table->boolean('prices_include_tax')->default(true);

            $table->boolean('reservations_enabled')->default(true);
            $table->unsignedSmallInteger('reservation_duration_minutes')->default(90);
            $table->unsignedSmallInteger('min_booking_hours_ahead')->default(1);
            $table->unsignedSmallInteger('max_booking_days_ahead')->default(30);
            $table->unsignedSmallInteger('no_show_tolerance_minutes')->default(15);

            $table->boolean('auto_publish')->default(true);

            $table->json('metadata')->nullable();
            $table->boolean('singleton')->default(true)->unique();

            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cfg_settings');
    }
};
