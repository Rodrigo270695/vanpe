<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuComboStep extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'menu_combo_steps';

    protected $fillable = [
        'combo_dish_id',
        'name',
        'slug',
        'min_picks',
        'max_picks',
        'included_picks',
        'extra_pick_price',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'min_picks' => 'integer',
            'max_picks' => 'integer',
            'included_picks' => 'integer',
            'extra_pick_price' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<MenuDish, $this> */
    public function comboDish(): BelongsTo
    {
        return $this->belongsTo(MenuDish::class, 'combo_dish_id');
    }

    /** @return HasMany<MenuComboStepOption, $this> */
    public function options(): HasMany
    {
        return $this->hasMany(MenuComboStepOption::class, 'step_id')->orderBy('sort_order');
    }
}
