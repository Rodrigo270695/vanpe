<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reservation extends Model
{
    use HasUuids;

    public const SOURCES = ['app', 'manual', 'phone', 'walkin'];

    public const STATUSES = [
        'pending',
        'confirmed',
        'seated',
        'completed',
        'no_show',
        'cancelled_customer',
        'cancelled_restaurant',
    ];

    /** Estados en los que el restaurante puede confirmar o rechazar (desde la app). */
    public const PENDING_APPROVAL = ['pending'];

    protected $connection = 'tenant';

    protected $table = 'reservations';

    protected $fillable = [
        'rsv_id',
        'code',
        'customer_name',
        'customer_phone',
        'date',
        'time',
        'party_size',
        'notes',
        'source',
        'status',
        'confirmed_at',
        'seated_at',
        'cancelled_at',
        'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'party_size' => 'integer',
            'confirmed_at' => 'datetime',
            'seated_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /** @return BelongsToMany<RstTable, $this> */
    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(
            RstTable::class,
            'reservation_tables',
            'reservation_id',
            'table_id',
        );
    }

    public function isFromApp(): bool
    {
        return $this->source === 'app';
    }

    public function needsApproval(): bool
    {
        return $this->status === 'pending' && $this->isFromApp();
    }
}
