<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cfg_service_hours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            /** 0 = lunes … 6 = domingo */
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opens_at')->default('12:00');
            $table->time('closes_at')->default('22:00');
            $table->boolean('active')->default(true);
            $table->timestampsTz();

            $table->unique('day_of_week');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cfg_service_hours');
    }
};
