<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Foto de un producto u obra, con su precio opcional. */
class CraftMedia extends Model
{
    use HasUuids;

    protected $table = 'craft_media';

    protected $fillable = [
        'craft_id',
        'url',
        'titulo',
        'precio',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function craft(): BelongsTo
    {
        return $this->belongsTo(Craft::class);
    }
}
