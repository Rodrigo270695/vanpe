<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_dishes', function (Blueprint $table) {
            $table->string('type', 15)->default('simple')->after('category_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('menu_dishes', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
        });
    }
};
