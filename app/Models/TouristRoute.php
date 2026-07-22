<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TouristRoute extends Model
{
    use HasUuids;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'customer_id',
        'name',
        'status',
        'stops_count',
        'distance_meters',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'stops_count' => 'integer',
            'distance_meters' => 'float',
            'duration_seconds' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function stops(): HasMany
    {
        return $this->hasMany(TouristRouteStop::class)->orderBy('sort_order');
    }
}
