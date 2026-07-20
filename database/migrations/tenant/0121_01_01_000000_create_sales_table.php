<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('numero', 20);

            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignUuid('cash_session_id')->nullable()->constrained('cash_sessions')->nullOnDelete();
            $table->foreignId('cajero_id')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('subtotal', 10, 2);
            $table->decimal('igv', 10, 2)->default(0);
            $table->decimal('descuento', 10, 2)->default(0);
            $table->decimal('total', 10, 2);

            $table->string('estado', 15)->default('pagada');
            $table->timestampsTz();

            $table->index(['estado', 'created_at']);
            $table->index('cash_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
