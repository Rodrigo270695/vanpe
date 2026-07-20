<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pub_availability_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('fecha');
            $table->time('hora');
            $table->unsignedSmallInteger('cupos_total')->default(1);
            $table->unsignedSmallInteger('cupos_ocupados')->default(0);
            $table->boolean('cerrado')->default(false);
            $table->timestampTz('updated_at')->nullable();

            $table->unique(['tenant_id', 'fecha', 'hora']);
            $table->index(['tenant_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pub_availability_slots');
    }
};
