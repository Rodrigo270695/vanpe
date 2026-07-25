<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rsv_reservation_events')) {
            return;
        }

        // actor_id: turista (int) o staff (uuid) → texto.
        DB::statement('ALTER TABLE rsv_reservation_events ALTER COLUMN actor_id TYPE varchar(64) USING actor_id::text');
    }

    public function down(): void
    {
        // No-op seguro: no forzar vuelta a uuid con datos mixtos.
    }
};
