<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TouristRouteStop extends Model
{
    use HasUuids;

    protected $fillable = [
        'tourist_route_id',
        'target_type',
        'target_id',
        'slug',
        'nombre',
        'latitud',
        'longitud',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'float',
            'longitud' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(TouristRoute::class, 'tourist_route_id');
    }
}
