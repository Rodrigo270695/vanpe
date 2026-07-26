<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Preferencia de catálogo del turista (cuisine / service / ambiance).
 *
 * @property int $id
 * @property int $customer_id
 * @property string $catalog_item_id
 * @property string $catalog_type
 */
class CustomerCatalogPreference extends Model
{
    protected $fillable = [
        'customer_id',
        'catalog_item_id',
        'catalog_type',
    ];

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<RefCatalogItem, $this> */
    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(RefCatalogItem::class, 'catalog_item_id');
    }
}
