<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            /** Vínculo con public.rsv_reservations cuando origen = app. Null en reservas manuales. */
            $table->uuid('rsv_id')->nullable()->unique();
            $table->string('code', 12)->unique();

            $table->string('customer_name', 120);
            $table->string('customer_phone', 20)->nullable();

            $table->date('date');
            $table->time('time');
            $table->unsignedSmallInteger('party_size');
            $table->string('notes', 300)->nullable();

            $table->string('source', 15)->default('manual');
            $table->string('status', 20)->default('pending');

            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('seated_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->string('cancel_reason', 200)->nullable();

            $table->timestampsTz();

            $table->index(['date', 'time']);
            $table->index('status');
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
