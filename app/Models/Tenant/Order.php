<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    public const TYPES = ['dine_in', 'takeaway', 'delivery'];

    public const STATUSES = ['open', 'kitchen', 'served', 'closed', 'cancelled'];

    public const ACTIVE_STATUSES = ['open', 'kitchen', 'served'];

    protected $connection = 'tenant';

    protected $table = 'orders';

    protected $fillable = [
        'number',
        'table_id',
        'reservation_id',
        'waiter_id',
        'type',
        'status',
        'subtotal',
        'discount',
        'total',
        'notes',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<RstTable, $this> */
    public function table(): BelongsTo
    {
        return $this->belongsTo(RstTable::class, 'table_id');
    }

    /** @return BelongsTo<Reservation, $this> */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id');
    }

    /** @return BelongsTo<User, $this> */
    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function isEditable(): bool
    {
        return $this->status === 'open';
    }

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true);
    }
}
