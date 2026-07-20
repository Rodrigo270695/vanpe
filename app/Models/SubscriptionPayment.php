<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    use HasUuids;

    public const CONCEPTS = ['subscription', 'reservation_commission', 'other'];

    public const STATUSES = ['pending', 'paid', 'failed', 'refunded'];

    public const GATEWAYS = ['culqi', 'izipay', 'mercadopago', 'transferencia'];

    protected $fillable = [
        'subscription_id',
        'tenant_id',
        'concept',
        'amount',
        'currency',
        'status',
        'gateway',
        'gateway_ref',
        'paid_at',
        'period_from',
        'period_to',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'period_from' => 'date',
            'period_to' => 'date',
        ];
    }

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
