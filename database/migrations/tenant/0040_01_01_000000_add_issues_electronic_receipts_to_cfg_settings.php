<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->boolean('issues_electronic_receipts')->default(false)->after('prices_include_tax');
        });
    }

    public function down(): void
    {
        Schema::table('cfg_settings', function (Blueprint $table) {
            $table->dropColumn('issues_electronic_receipts');
        });
    }
};
