<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuCategory extends Model
{
    use HasUuids, SoftDeletes;

    protected $connection = 'tenant';

    protected $table = 'menu_categories';

    public const MENU_ROLES = ['entrada', 'bebida', 'menu', 'carta'];

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'sort_order',
        'active',
        'menu_role',
        'system_key',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'active' => 'boolean',
            'is_system' => 'boolean',
        ];
    }

    /** @return HasMany<MenuDish, $this> */
    public function dishes(): HasMany
    {
        return $this->hasMany(MenuDish::class, 'category_id');
    }
}
