<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourEventMedia extends Model
{
    use HasUuids;

    protected $table = 'tour_event_media';

    protected $fillable = [
        'tour_event_id',
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

    public function event(): BelongsTo
    {
        return $this->belongsTo(TourEvent::class, 'tour_event_id');
    }
}
