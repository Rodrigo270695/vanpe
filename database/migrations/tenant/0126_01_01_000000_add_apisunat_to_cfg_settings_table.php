<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->boolean('emite_comprobantes_sunat')->default(false)->after('issues_electronic_receipts');
            $table->text('apisunat_token_enc')->nullable()->after('emite_comprobantes_sunat');
            $table->string('apisunat_mode', 20)->default('sandbox')->after('apisunat_token_enc');
            $table->boolean('apisunat_configurado')->default(false)->after('apisunat_mode');
        });
    }

    public function down(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->dropColumn([
                'emite_comprobantes_sunat',
                'apisunat_token_enc',
                'apisunat_mode',
                'apisunat_configurado',
            ]);
        });
    }
};
