<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ref_catalog_proposals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('suggested_name', 100);
            $table->string('status', 20)->default('pending');
            $table->foreignUuid('catalog_item_id')->nullable()->constrained('ref_catalog_items')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('reviewed_at')->nullable();
            $table->string('rejection_reason', 255)->nullable();
            $table->timestampsTz();

            $table->index(['status', 'created_at']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ref_catalog_proposals');
    }
};
