<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->timestampTz('anulada_en')->nullable()->after('estado');
            $table->foreignId('anulado_por')->nullable()->after('anulada_en')->constrained('users')->nullOnDelete();
            $table->text('motivo_anulacion')->nullable()->after('anulado_por');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('anulado_por');
            $table->dropColumn(['anulada_en', 'motivo_anulacion']);
        });
    }
};
