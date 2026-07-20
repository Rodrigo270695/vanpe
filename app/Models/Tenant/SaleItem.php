<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $connection = 'tenant';

    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'nombre_snapshot',
        'precio_snapshot',
        'cantidad',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'precio_snapshot' => 'decimal:2',
            'cantidad' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
