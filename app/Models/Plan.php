<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    protected $fillable = [
        'code',
        'name',
        'description',
        'badge',
        'color_hex',
        'monthly_price',
        'yearly_price',
        'trial_days',
        'reservation_commission',
        'sort_order',
        'is_public',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'reservation_commission' => 'decimal:2',
            'trial_days' => 'integer',
            'sort_order' => 'integer',
            'is_public' => 'boolean',
            'active' => 'boolean',
        ];
    }

    /** @return HasMany<PlanFeature, $this> */
    public function features(): HasMany
    {
        return $this->hasMany(PlanFeature::class);
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
