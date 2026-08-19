<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TouristInterestGroup extends Model
{
    use HasUuids;

    public const TARGET_RESTAURANT = 'restaurant';

    public const TARGET_TOUR_SPOT = 'tour_spot';

    protected $fillable = [
        'slug',
        'name_es',
        'name_en',
        'icon',
        'target_entity',
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

    public function categories(): HasMany
    {
        return $this->hasMany(TouristInterestCategory::class, 'group_id');
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(
            Customer::class,
            'customer_interest_group_preferences',
            'interest_group_id',
            'customer_id',
        )->withTimestamps();
    }

    /**
     * @return array<string, mixed>
     */
    public function toOptionArray(?string $locale = null): array
    {
        $locale = $locale === 'en' ? 'en' : 'es';

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $locale === 'en' ? $this->name_en : $this->name_es,
            'name_es' => $this->name_es,
            'name_en' => $this->name_en,
            'icon' => $this->icon,
            'target_entity' => $this->target_entity,
            'sort_order' => $this->sort_order,
        ];
    }
}
