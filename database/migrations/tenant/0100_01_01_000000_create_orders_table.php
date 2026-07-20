<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('number', 20);

            $table->foreignUuid('table_id')->nullable()->constrained('rst_tables')->nullOnDelete();
            $table->foreignUuid('reservation_id')->nullable()->constrained('reservations')->nullOnDelete();
            $table->foreignId('waiter_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('type', 15)->default('dine_in');
            $table->string('status', 20)->default('open');

            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);

            $table->string('notes', 300)->nullable();

            $table->timestampTz('opened_at')->useCurrent();
            $table->timestampTz('closed_at')->nullable();

            $table->timestampsTz();

            $table->index(['status', 'opened_at']);
            $table->index('table_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
