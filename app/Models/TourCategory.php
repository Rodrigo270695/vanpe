<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TourCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'slug',
        'name_es',
        'name_en',
        'icon',
        'color_hex',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function spots(): BelongsToMany
    {
        return $this->belongsToMany(TourSpot::class, 'tour_spot_categories')
            ->withPivot('is_primary');
    }

    public function labelForLocale(?string $locale = null): string
    {
        $locale ??= app()->getLocale();

        return str_starts_with($locale, 'en') ? $this->name_en : $this->name_es;
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(?string $locale = null): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->labelForLocale($locale),
            'name_es' => $this->name_es,
            'name_en' => $this->name_en,
            'icon' => $this->icon,
            'color_hex' => $this->color_hex,
            'sort_order' => $this->sort_order,
            'active' => $this->active,
        ];
    }
}
