<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtraordinaryEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'titulo',
        'slug',
        'cta_label',
        'floating_text',
        'descripcion',
        'logo_url',
        'year_effect',
        'starts_at',
        'ends_at',
        'active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function stops(): HasMany
    {
        return $this->hasMany(ExtraordinaryEventStop::class)->orderBy('sort_order');
    }

    public function scopeActiveNow($query)
    {
        $now = now();

        return $query
            ->where('active', true)
            ->where(function ($q) use ($now): void {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now): void {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            });
    }
}
