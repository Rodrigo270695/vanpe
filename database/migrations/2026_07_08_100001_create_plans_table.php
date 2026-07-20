<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();
            $table->string('name', 80);
            $table->text('description')->nullable();
            $table->string('badge', 50)->nullable();
            $table->string('color_hex', 7)->nullable();

            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('yearly_price', 10, 2)->nullable();
            $table->unsignedSmallInteger('trial_days')->default(0);
            $table->decimal('reservation_commission', 6, 2)->default(0);

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_public')->default(true);
            $table->boolean('active')->default(true);

            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
