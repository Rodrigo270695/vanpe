<?php

namespace App\Services\Tenant;

use App\Models\Tenant\RstTable;
use App\Models\Tenant\WaitingList;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WaitingListService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function add(array $data): WaitingList
    {
        return WaitingList::query()->create([
            'cliente_nombre' => $data['cliente_nombre'],
            'cliente_telefono' => $data['cliente_telefono'] ?? null,
            'num_personas' => $data['num_personas'],
            'notas' => $data['notas'] ?? null,
            'hora_llegada' => now(),
            'estado' => 'esperando',
        ]);
    }

    public function seat(WaitingList $entry, string $tableId): WaitingList
    {
        if (! $entry->isWaiting()) {
            throw ValidationException::withMessages([
                'estado' => __('messages.lista_espera.not_waiting'),
            ]);
        }

        $table = RstTable::query()->whereKey($tableId)->where('active', true)->first();

        if ($table === null) {
            throw ValidationException::withMessages([
                'table_id' => __('messages.lista_espera.table_invalid'),
            ]);
        }

        if (! in_array($table->status, ['free', 'reserved'], true)) {
            throw ValidationException::withMessages([
                'table_id' => __('messages.lista_espera.table_busy'),
            ]);
        }

        return DB::transaction(function () use ($entry, $table): WaitingList {
            $table->update(['status' => 'occupied']);

            $entry->update([
                'estado' => 'sentado',
                'table_id' => $table->id,
            ]);

            return $entry->fresh(['table']);
        });
    }

    public function withdraw(WaitingList $entry): void
    {
        if ($entry->estado === 'retirado') {
            return;
        }

        $entry->update(['estado' => 'retirado']);
    }
}
