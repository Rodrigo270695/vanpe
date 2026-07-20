<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuDish extends Model
{
    use HasUuids, SoftDeletes;

    protected $connection = 'tenant';

    protected $table = 'menu_dishes';

    public const TYPES = ['simple', 'combo'];

    protected $fillable = [
        'category_id',
        'type',
        'name',
        'description',
        'price',
        'image_url',
        'available',
        'publish_in_app',
        'featured',
        'sort_order',
        'includes_menu_addons',
        'includes_drink_in_price',
        'is_drink',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'available' => 'boolean',
            'publish_in_app' => 'boolean',
            'featured' => 'boolean',
            'sort_order' => 'integer',
            'includes_menu_addons' => 'boolean',
            'includes_drink_in_price' => 'boolean',
            'is_drink' => 'boolean',
        ];
    }

    /** @return BelongsTo<MenuCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    /** @return HasMany<MenuComboStep, $this> */
    public function comboSteps(): HasMany
    {
        return $this->hasMany(MenuComboStep::class, 'combo_dish_id')->orderBy('sort_order');
    }

    public function isCombo(): bool
    {
        return $this->type === 'combo';
    }
}
