<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PubRestaurantCatalogItem extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';

    protected $fillable = [
        'tenant_id',
        'catalog_item_id',
        'catalog_type',
        'slug',
        'name_es',
        'name_en',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
