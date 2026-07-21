<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourSpotMedia extends Model
{
    use HasUuids;

    protected $table = 'tour_spot_media';

    protected $fillable = [
        'tour_spot_id',
        'tipo',
        'url',
        'caption',
        'sort_order',
        'is_cover',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_cover' => 'boolean',
        ];
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(TourSpot::class, 'tour_spot_id');
    }
}
