<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TouristInterestCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'group_id',
        'slug',
        'name_es',
        'name_en',
        'icon',
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

    public function group(): BelongsTo
    {
        return $this->belongsTo(TouristInterestGroup::class, 'group_id');
    }

    public function catalogItems(): BelongsToMany
    {
        return $this->belongsToMany(
            RefCatalogItem::class,
            'tourist_interest_category_catalog_item',
            'interest_category_id',
            'catalog_item_id',
        );
    }

    public function tourCategories(): BelongsToMany
    {
        return $this->belongsToMany(
            TourCategory::class,
            'tourist_interest_category_tour_category',
            'interest_category_id',
            'tour_category_id',
        );
    }
}
