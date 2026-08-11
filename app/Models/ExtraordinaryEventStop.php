<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtraordinaryEventStop extends Model
{
    use HasUuids;

    protected $fillable = [
        'extraordinary_event_id',
        'nombre',
        'slug',
        'target_type',
        'target_id',
        'latitud',
        'longitud',
        'visita_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'float',
            'longitud' => 'float',
            'visita_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ExtraordinaryEvent::class, 'extraordinary_event_id');
    }
}
