<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_favorites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            // restaurant | tour_spot
            $table->string('target_type', 30);
            $table->uuid('target_id');
            $table->timestampsTz();

            $table->unique(['customer_id', 'target_type', 'target_id'], 'app_favorites_unique');
            $table->index(['customer_id', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });

        Schema::create('rsv_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('codigo', 12)->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('restaurant_id')->constrained('pub_restaurants')->cascadeOnDelete();

            $table->date('fecha');
            $table->time('hora');
            $table->unsignedSmallInteger('num_personas');
            $table->string('nombre_contacto', 120);
            $table->string('telefono_contacto', 20);
            $table->string('notas', 300)->nullable();

            // pendiente|confirmada|sentada|cumplida|no_show|cancelada_cliente|cancelada_restaurante
            $table->string('estado', 30)->default('pendiente');

            $table->foreignUuid('slot_id')
                ->nullable()
                ->constrained('pub_availability_slots')
                ->nullOnDelete();

            $table->decimal('comision_aplicada', 6, 2)->default(0);
            $table->string('comision_estado', 15)->default('na');

            $table->timestampTz('confirmada_en')->nullable();
            $table->timestampTz('cancelada_en')->nullable();
            $table->string('cancelada_motivo', 200)->nullable();
            $table->timestampsTz();

            $table->index(['customer_id', 'fecha']);
            $table->index(['tenant_id', 'fecha']);
            $table->index(['estado']);
        });

        Schema::create('rsv_reservation_events', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('reservation_id')
                ->constrained('rsv_reservations')
                ->cascadeOnDelete();
            $table->string('estado_anterior', 30)->nullable();
            $table->string('estado_nuevo', 30);
            // turista|restaurante|sistema
            $table->string('actor_tipo', 15);
            $table->uuid('actor_id')->nullable();
            $table->string('nota', 255)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['reservation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rsv_reservation_events');
        Schema::dropIfExists('rsv_reservations');
        Schema::dropIfExists('app_favorites');
    }
};
