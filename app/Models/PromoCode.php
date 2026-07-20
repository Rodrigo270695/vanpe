<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    use HasUuids;

    public const TYPES = ['percentage', 'amount', 'trial_extra'];

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'max_uses',
        'uses',
        'valid_from',
        'valid_until',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'max_uses' => 'integer',
            'uses' => 'integer',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'active' => 'boolean',
        ];
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isCurrentlyValid(): bool
    {
        if (! $this->active) {
            return false;
        }

        $today = now()->toDateString();

        if ($this->valid_from && $today < $this->valid_from->toDateString()) {
            return false;
        }

        if ($this->valid_until && $today > $this->valid_until->toDateString()) {
            return false;
        }

        if ($this->max_uses !== null && $this->uses >= $this->max_uses) {
            return false;
        }

        return true;
    }
}
