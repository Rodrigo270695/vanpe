<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerInterestGroupPreference extends Model
{
    protected $fillable = [
        'customer_id',
        'interest_group_id',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TouristInterestGroup::class, 'interest_group_id');
    }
}
