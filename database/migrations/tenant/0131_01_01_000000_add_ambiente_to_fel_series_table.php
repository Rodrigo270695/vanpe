<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fel_series', function (Blueprint $table) {
            $table->string('ambiente', 12)->default('produccion')->after('serie');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignUuid('fel_serie_id')->nullable()->after('fel_document_id')
                ->constrained('fel_series')->nullOnDelete();
        });

        Schema::table('fel_series', function (Blueprint $table) {
            $table->dropUnique(['tipo_comprobante', 'serie']);
            $table->unique(['tipo_comprobante', 'serie', 'ambiente']);
        });
    }

    public function down(): void
    {
        Schema::table('fel_series', function (Blueprint $table) {
            $table->dropUnique(['tipo_comprobante', 'serie', 'ambiente']);
            $table->unique(['tipo_comprobante', 'serie']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fel_serie_id');
        });

        Schema::table('fel_series', function (Blueprint $table) {
            $table->dropColumn('ambiente');
        });
    }
};
