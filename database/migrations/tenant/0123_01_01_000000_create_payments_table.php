<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('cajero_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('metodo', 20);
            $table->decimal('monto', 10, 2);
            $table->string('referencia', 100)->nullable();

            $table->timestampTz('recibido_en')->useCurrent();

            $table->index('sale_id');
            $table->index('metodo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
