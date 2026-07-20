<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanFeature extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'plan_id',
        'feature',
        'value_int',
        'value_bool',
        'value_str',
    ];

    protected function casts(): array
    {
        return [
            'value_int' => 'integer',
            'value_bool' => 'boolean',
        ];
    }

    /** @return BelongsTo<Plan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
