<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemSelection extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'order_item_selections';

    protected $fillable = [
        'order_item_id',
        'step_name',
        'step_slug',
        'dish_id',
        'name_snapshot',
        'extra_price',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'extra_price' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<OrderItem, $this> */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    /** @return BelongsTo<MenuDish, $this> */
    public function dish(): BelongsTo
    {
        return $this->belongsTo(MenuDish::class, 'dish_id');
    }
}
