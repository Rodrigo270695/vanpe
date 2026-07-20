<?php

namespace App\Services\Tenant;

use App\Models\Tenant\MenuCategory;

class MenuStructureService
{
    public const SYSTEM_KEYS = ['entrada', 'bebida', 'menu', 'carta'];

    /**
     * @return array<int, array<string, mixed>>
     */
    public function systemDefinitions(): array
    {
        return [
            [
                'system_key' => 'entrada',
                'menu_role' => 'entrada',
                'name' => __('messages.carta.system_category_entrada'),
                'sort_order' => 1,
            ],
            [
                'system_key' => 'bebida',
                'menu_role' => 'bebida',
                'name' => __('messages.carta.system_category_bebida'),
                'sort_order' => 2,
            ],
            [
                'system_key' => 'menu',
                'menu_role' => 'menu',
                'name' => __('messages.carta.system_category_menu'),
                'sort_order' => 3,
            ],
            [
                'system_key' => 'carta',
                'menu_role' => 'carta',
                'name' => __('messages.carta.system_category_carta'),
                'sort_order' => 4,
            ],
        ];
    }

    public function ensureSystemCategories(): void
    {
        foreach ($this->systemDefinitions() as $definition) {
            $category = MenuCategory::query()
                ->where('system_key', $definition['system_key'])
                ->first();

            if ($category === null) {
                MenuCategory::query()->create([
                    ...$definition,
                    'is_system' => true,
                    'active' => true,
                ]);

                continue;
            }

            $category->update([
                'menu_role' => $definition['menu_role'],
                'is_system' => true,
                'sort_order' => $definition['sort_order'],
            ]);
        }
    }

    public function isSystemCategory(MenuCategory $category): bool
    {
        return $category->is_system || $category->system_key !== null;
    }
}
