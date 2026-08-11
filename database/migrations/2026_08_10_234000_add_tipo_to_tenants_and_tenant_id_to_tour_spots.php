<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('tipo', 32)->default('restaurant')->after('schema_name');
            $table->index('tipo');
        });

        Schema::table('tour_spots', function (Blueprint $table) {
            $table->foreignUuid('tenant_id')
                ->nullable()
                ->after('id')
                ->constrained('tenants')
                ->nullOnDelete();
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('tour_spots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['tipo']);
            $table->dropColumn('tipo');
        });
    }
};
