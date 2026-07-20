<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PubAvailabilitySlot extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'fecha',
        'hora',
        'cupos_total',
        'cupos_ocupados',
        'cerrado',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'cupos_total' => 'integer',
            'cupos_ocupados' => 'integer',
            'cerrado' => 'boolean',
            'updated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
