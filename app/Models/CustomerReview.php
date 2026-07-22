<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReview extends Model
{
    use HasUuids;

    public const TARGET_RESTAURANT = 'restaurant';

    public const TARGET_TOUR_SPOT = 'tour_spot';

    protected $fillable = [
        'customer_id',
        'target_type',
        'target_id',
        'rating',
        'titulo',
        'comentario',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
