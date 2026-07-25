<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RsvReservationEvent extends Model
{
    public $timestamps = false;

    protected $table = 'rsv_reservation_events';

    protected $fillable = [
        'reservation_id',
        'estado_anterior',
        'estado_nuevo',
        'actor_tipo',
        'actor_id',
        'nota',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<RsvReservation, $this> */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(RsvReservation::class, 'reservation_id');
    }
}
