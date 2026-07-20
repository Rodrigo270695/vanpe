<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fel_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')
                ->unique()
                ->constrained('sales')
                ->cascadeOnDelete();
            $table->foreignUuid('fel_serie_id')
                ->constrained('fel_series')
                ->restrictOnDelete();

            $table->unsignedTinyInteger('tipo_comprobante');
            $table->string('serie', 4);
            $table->unsignedBigInteger('correlativo');
            $table->string('numero_completo', 20);

            $table->unsignedTinyInteger('receptor_tipo_doc');
            $table->string('receptor_num_doc', 15);
            $table->string('receptor_nombre', 200);

            $table->decimal('subtotal', 14, 2);
            $table->decimal('igv_monto', 14, 2);
            $table->decimal('total', 14, 2);
            $table->char('moneda', 3)->default('PEN');

            $table->string('estado', 24)->default('pendiente');
            $table->string('proveedor_ref', 100)->nullable();
            $table->string('url_pdf', 500)->nullable();
            $table->string('url_xml', 500)->nullable();
            $table->string('url_cdr', 500)->nullable();
            $table->string('enlace_consulta', 500)->nullable();
            $table->json('apisunat_payload')->nullable();
            $table->string('apisunat_mode', 20)->nullable();
            $table->text('error_mensaje')->nullable();
            $table->timestampTz('emitido_at')->nullable();
            $table->timestampTz('anulado_at')->nullable();
            $table->timestampsTz();

            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fel_documents');
    }
};
