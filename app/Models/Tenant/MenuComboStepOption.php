<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuComboStepOption extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'menu_combo_step_options';

    protected $fillable = [
        'step_id',
        'dish_id',
        'supplement',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'supplement' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<MenuComboStep, $this> */
    public function step(): BelongsTo
    {
        return $this->belongsTo(MenuComboStep::class, 'step_id');
    }

    /** @return BelongsTo<MenuDish, $this> */
    public function dish(): BelongsTo
    {
        return $this->belongsTo(MenuDish::class, 'dish_id');
    }
}
