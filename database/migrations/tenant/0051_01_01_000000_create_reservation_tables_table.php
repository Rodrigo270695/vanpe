<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_tables', function (Blueprint $table) {
            $table->foreignUuid('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignUuid('table_id')->constrained('rst_tables')->cascadeOnDelete();

            $table->primary(['reservation_id', 'table_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_tables');
    }
};
