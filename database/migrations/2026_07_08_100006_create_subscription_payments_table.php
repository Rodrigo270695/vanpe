<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_id')
                ->constrained('subscriptions')
                ->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->constrained('tenants');

            $table->string('concept', 30)->default('subscription');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('PEN');

            $table->string('status', 20)->default('pending');
            $table->string('gateway', 30)->nullable();
            $table->string('gateway_ref', 120)->nullable();
            $table->timestampTz('paid_at')->nullable();

            $table->date('period_from')->nullable();
            $table->date('period_to')->nullable();

            $table->timestampsTz();

            $table->index('tenant_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
