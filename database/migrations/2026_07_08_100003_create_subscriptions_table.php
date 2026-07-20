<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('plans');

            $table->string('status', 20)->default('trial');
            $table->string('billing_cycle', 10)->default('monthly');

            $table->decimal('current_price', 10, 2);
            $table->decimal('reservation_commission', 6, 2)->default(0);

            $table->timestampTz('period_start');
            $table->timestampTz('period_end');
            $table->boolean('auto_renew')->default(true);
            $table->timestampTz('cancelled_at')->nullable();

            $table->timestampsTz();

            $table->index('status');
            $table->index('period_end');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
