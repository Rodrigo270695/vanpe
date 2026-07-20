<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    use HasUuids;

    public const KITCHEN_STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

    protected $connection = 'tenant';

    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'item_type',
        'dish_id',
        'name_snapshot',
        'price_snapshot',
        'quantity',
        'subtotal',
        'kitchen_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price_snapshot' => 'decimal:2',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /** @return BelongsTo<MenuDish, $this> */
    public function dish(): BelongsTo
    {
        return $this->belongsTo(MenuDish::class, 'dish_id');
    }

    /** @return HasMany<OrderItemSelection, $this> */
    public function selections(): HasMany
    {
        return $this->hasMany(OrderItemSelection::class, 'order_item_id')->orderBy('sort_order');
    }
}
