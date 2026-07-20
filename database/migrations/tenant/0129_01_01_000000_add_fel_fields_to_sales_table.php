<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('tipo_comprobante', 20)->default('nota_venta')->after('estado');
            $table->string('fel_estado', 24)->default('sin_cpe')->after('tipo_comprobante');
            $table->foreignUuid('fel_document_id')->nullable()->after('fel_estado')
                ->constrained('fel_documents')->nullOnDelete();
            $table->unsignedTinyInteger('cliente_tipo_doc')->nullable()->after('fel_document_id');
            $table->string('cliente_num_doc', 15)->nullable()->after('cliente_tipo_doc');
            $table->string('cliente_nombre', 200)->nullable()->after('cliente_num_doc');
            $table->string('cliente_direccion', 250)->nullable()->after('cliente_nombre');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fel_document_id');
            $table->dropColumn([
                'tipo_comprobante',
                'fel_estado',
                'cliente_tipo_doc',
                'cliente_num_doc',
                'cliente_nombre',
                'cliente_direccion',
            ]);
        });
    }
};
