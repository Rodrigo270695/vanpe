<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RstTable extends Model
{
    use HasUuids, SoftDeletes;

    public const STATUSES = ['free', 'occupied', 'reserved', 'inactive'];

    public const SHAPES = ['square', 'round', 'rectangular'];

    protected $connection = 'tenant';

    protected $table = 'rst_tables';

    protected $fillable = [
        'area_id',
        'number',
        'capacity',
        'capacity_max',
        'status',
        'pos_x',
        'pos_y',
        'shape',
        'qr_token',
        'reservable',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'capacity_max' => 'integer',
            'pos_x' => 'integer',
            'pos_y' => 'integer',
            'reservable' => 'boolean',
            'active' => 'boolean',
        ];
    }

    /** @return BelongsTo<RstArea, $this> */
    public function area(): BelongsTo
    {
        return $this->belongsTo(RstArea::class, 'area_id');
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
