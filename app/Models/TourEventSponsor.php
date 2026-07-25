<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourEventSponsor extends Model
{
    use HasUuids;

    public const TIPOS = ['auspiciador', 'orquesta', 'artista', 'otro'];

    protected $table = 'tour_event_sponsors';

    protected $fillable = [
        'tour_event_id',
        'nombre',
        'tipo',
        'logo_url',
        'website',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(TourEvent::class, 'tour_event_id');
    }
}
