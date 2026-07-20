<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasUuids;

    public const STATUSES = ['trial', 'active', 'past_due', 'suspended', 'cancelled'];

    public const BILLING_CYCLES = ['monthly', 'yearly'];

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'billing_cycle',
        'current_price',
        'reservation_commission',
        'period_start',
        'period_end',
        'auto_renew',
        'cancelled_at',
        'promo_code_id',
    ];

    protected function casts(): array
    {
        return [
            'current_price' => 'decimal:2',
            'reservation_commission' => 'decimal:2',
            'period_start' => 'datetime',
            'period_end' => 'datetime',
            'auto_renew' => 'boolean',
            'cancelled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return BelongsTo<Plan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /** @return BelongsTo<PromoCode, $this> */
    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    /** @return HasMany<SubscriptionPayment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }
}
