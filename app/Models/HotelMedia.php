<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelMedia extends Model
{
    use HasUuids;

    protected $table = 'hotel_media';

    protected $fillable = [
        'hotel_id',
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

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }
}
