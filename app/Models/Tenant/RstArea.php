<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RstArea extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'rst_areas';

    protected $fillable = [
        'name',
        'description',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'active' => 'boolean',
        ];
    }

    /** @return HasMany<RstTable, $this> */
    public function tables(): HasMany
    {
        return $this->hasMany(RstTable::class, 'area_id');
    }
}
