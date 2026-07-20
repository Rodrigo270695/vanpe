<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Campos de identidad de la persona para el personal del restaurante (tenant).
 * Nombres de columna en inglés. Se aplica en cada schema rst_*.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('document_type', 20)->nullable()->after('id');
            $table->string('document_number', 20)->nullable()->after('document_type');
            $table->string('first_name', 120)->nullable()->after('name');
            $table->string('paternal_surname', 120)->nullable()->after('first_name');
            $table->string('maternal_surname', 120)->nullable()->after('paternal_surname');

            $table->index(['document_type', 'document_number']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['document_type', 'document_number']);
            $table->dropColumn([
                'document_type',
                'document_number',
                'first_name',
                'paternal_surname',
                'maternal_surname',
            ]);
        });
    }
};
