<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaitingList extends Model
{
    use HasUuids;

    public const STATUSES = ['esperando', 'sentado', 'retirado'];

    protected $connection = 'tenant';

    protected $table = 'waiting_list';

    protected $fillable = [
        'cliente_nombre',
        'cliente_telefono',
        'num_personas',
        'hora_llegada',
        'estado',
        'notas',
        'table_id',
    ];

    protected function casts(): array
    {
        return [
            'num_personas' => 'integer',
            'hora_llegada' => 'datetime',
        ];
    }

    /** @return BelongsTo<RstTable, $this> */
    public function table(): BelongsTo
    {
        return $this->belongsTo(RstTable::class, 'table_id');
    }

    public function isWaiting(): bool
    {
        return $this->estado === 'esperando';
    }
}
