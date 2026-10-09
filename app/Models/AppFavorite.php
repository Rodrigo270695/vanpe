<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppFavorite extends Model
{
    use HasUuids;

    public const TARGET_RESTAURANT = 'restaurant';

    public const TARGET_TOUR_SPOT = 'tour_spot';

    public const TARGET_HOTEL = 'hotel';

    public const TARGET_CRAFT = 'craft';

    public const TARGETS = [self::TARGET_RESTAURANT, self::TARGET_TOUR_SPOT, self::TARGET_HOTEL, self::TARGET_CRAFT];

    protected $table = 'app_favorites';

    protected $fillable = [
        'customer_id',
        'target_type',
        'target_id',
    ];

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
