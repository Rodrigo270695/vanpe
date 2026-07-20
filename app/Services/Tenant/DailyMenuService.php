<?php

namespace App\Services\Tenant;

use App\Models\Tenant\MenuDish;
use App\Models\Tenant\Order;
use App\Models\Tenant\OrderItem;
use App\Models\Tenant\OrderItemSelection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DailyMenuService
{
    /**
     * @return array<string, mixed>
     */
    public function configForOrders(): array
    {
        return [
            'entrada_groups' => $this->buildAddonGroups('entrada'),
            'bebida_groups' => $this->buildAddonGroups('bebida'),
        ];
    }

    public function isMenuDish(MenuDish $dish): bool
    {
        $dish->loadMissing('category:id,menu_role');

        return $dish->category?->menu_role === 'menu' || $dish->includes_menu_addons;
    }

    /**
     * @param  array<int, string>  $entradaIds
     */
    public function updateItemSelections(
        OrderItem $item,
        array $entradaIds,
        ?string $bebidaId,
    ): OrderItem {
        $order = $item->order;

        if (! $order->isEditable()) {
            throw ValidationException::withMessages([
                'status' => __('messages.pedidos.order_not_editable'),
            ]);
        }

        if ($item->item_type !== 'daily_menu') {
            throw ValidationException::withMessages([
                'item' => __('messages.pedidos.daily_menu_invalid_selection'),
            ]);
        }

        $mainDish = $item->dish?->loadMissing('category:id,menu_role');

        if ($mainDish === null || ! $this->isMenuDish($mainDish)) {
            throw ValidationException::withMessages([
                'item' => __('messages.pedidos.daily_menu_invalid_selection'),
            ]);
        }

        $selections = $this->buildAddonSelections($entradaIds, $bebidaId);
        $dishes = $this->resolveAddonDishes($selections, $mainDish);
        $this->validateAddonSelections($selections, $dishes, $mainDish);

        return DB::transaction(function () use ($item, $selections, $dishes): OrderItem {
            $item->selections()->delete();

            $resolved = $this->resolveSelectionRows($selections, $dishes);

            foreach ($resolved as $index => $row) {
                OrderItemSelection::query()->create([
                    'order_item_id' => $item->id,
                    'step_name' => $row['step_name'],
                    'step_slug' => $row['step_slug'],
                    'dish_id' => $row['dish_id'],
                    'name_snapshot' => $row['name'],
                    'extra_price' => '0',
                    'sort_order' => $index,
                ]);
            }

            return $item->load('selections');
        });
    }

    public function itemSelectionsComplete(OrderItem $item): bool
    {
        if ($item->item_type !== 'daily_menu') {
            return true;
        }

        $mainDish = $item->relationLoaded('dish')
            ? $item->dish
            : $item->dish()->with('category:id,menu_role')->first();

        if ($mainDish === null || ! $this->isMenuDish($mainDish)) {
            return true;
        }

        $selections = $item->relationLoaded('selections')
            ? $item->selections
            : $item->selections()->get();

        $entradaCount = $selections->where('step_slug', 'entrada')->count();

        if ($entradaCount < 1 || $entradaCount > 2) {
            return false;
        }

        if ($this->roleAddonsQuery('bebida')->exists()) {
            return $selections->where('step_slug', 'bebida')->count() === 1;
        }

        return true;
    }

    public function assertOrderSelectionsComplete(Order $order): void
    {
        $order->loadMissing(['items.dish.category', 'items.selections']);

        foreach ($order->items as $item) {
            if ($item->item_type === 'daily_menu' && ! $this->itemSelectionsComplete($item)) {
                throw ValidationException::withMessages([
                    'items' => __('messages.pedidos.daily_menu_incomplete', [
                        'dish' => $item->name_snapshot,
                    ]),
                ]);
            }
        }
    }

    /**
     * @param  array<int, string>  $entradaIds
     * @return array<int, array{step_slug: string, dish_id: string}>
     */
    private function buildAddonSelections(array $entradaIds, ?string $bebidaId): array
    {
        $selections = [];

        foreach ($entradaIds as $entradaId) {
            $selections[] = ['step_slug' => 'entrada', 'dish_id' => $entradaId];
        }

        if ($bebidaId !== null) {
            $selections[] = ['step_slug' => 'bebida', 'dish_id' => $bebidaId];
        }

        return $selections;
    }

    /**
     * @param  array<int, array{step_slug: string, dish_id: string}>  $selections
     * @return Collection<string, MenuDish>
     */
    private function resolveAddonDishes(array $selections, MenuDish $mainDish): Collection
    {
        $ids = array_column($selections, 'dish_id');

        if ($ids === []) {
            return collect();
        }

        return MenuDish::query()
            ->with('category:id,menu_role,name')
            ->whereIn('id', $ids)
            ->where('available', true)
            ->where('type', 'simple')
            ->where('id', '!=', $mainDish->id)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  array<int, array{step_slug: string, dish_id: string}>  $selections
     * @param  Collection<string, MenuDish>  $dishes
     */
    private function validateAddonSelections(
        array $selections,
        Collection $dishes,
        MenuDish $mainDish,
    ): void {
        if ($dishes->count() !== count($selections)) {
            throw ValidationException::withMessages([
                'entrada_dish_ids' => __('messages.pedidos.daily_menu_invalid_selection'),
            ]);
        }

        $counts = ['entrada' => 0, 'bebida' => 0];

        foreach ($selections as $selection) {
            $dish = $dishes->get($selection['dish_id']);

            if ($dish === null || $dish->isCombo()) {
                throw ValidationException::withMessages([
                    'entrada_dish_ids' => __('messages.pedidos.dish_unavailable'),
                ]);
            }

            $expectedRole = $selection['step_slug'] === 'bebida' ? 'bebida' : 'entrada';

            if ($dish->category?->menu_role !== $expectedRole) {
                throw ValidationException::withMessages([
                    'entrada_dish_ids' => __('messages.pedidos.daily_menu_wrong_category', [
                        'dish' => $dish->name,
                    ]),
                ]);
            }

            $counts[$selection['step_slug']]++;
        }

        if ($counts['entrada'] < 1 || $counts['entrada'] > 2) {
            throw ValidationException::withMessages([
                'entrada_dish_ids' => __('messages.pedidos.daily_menu_entrada_count'),
            ]);
        }

        if ($counts['bebida'] > 1) {
            throw ValidationException::withMessages([
                'bebida_dish_id' => __('messages.pedidos.daily_menu_bebida_max'),
            ]);
        }

        if (
            $this->roleAddonsQuery('bebida')->exists()
            && $counts['bebida'] !== 1
        ) {
            throw ValidationException::withMessages([
                'bebida_dish_id' => __('messages.pedidos.daily_menu_bebida_required'),
            ]);
        }
    }

    /**
     * @param  array<int, array{step_slug: string, dish_id: string}>  $selections
     * @param  Collection<string, MenuDish>  $dishes
     * @return array<int, array{step_slug: string, step_name: string, dish_id: string, name: string}>
     */
    private function resolveSelectionRows(array $selections, Collection $dishes): array
    {
        $rows = [];

        $ordered = collect($selections)->sortBy(fn (array $selection): int => match ($selection['step_slug']) {
            'entrada' => 0,
            'bebida' => 1,
            default => 2,
        });

        foreach ($ordered as $selection) {
            $dish = $dishes->get($selection['dish_id']);

            $rows[] = [
                'step_slug' => $selection['step_slug'],
                'step_name' => $this->stepLabel($selection['step_slug']),
                'dish_id' => $dish?->id,
                'name' => $dish?->name ?? '—',
            ];
        }

        return $rows;
    }

    private function stepLabel(string $slug): string
    {
        return match ($slug) {
            'entrada' => __('messages.pedidos.daily_menu_step_entrada'),
            'bebida' => __('messages.pedidos.daily_menu_step_bebida'),
            default => $slug,
        };
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildAddonGroups(string $role): array
    {
        $dishes = $this->roleAddonsQuery($role)
            ->with('category:id,name,sort_order')
            ->get()
            ->sortBy([
                fn (MenuDish $dish) => $dish->sort_order,
                fn (MenuDish $dish) => $dish->name,
            ]);

        if ($dishes->isEmpty()) {
            return [];
        }

        $categoryName = match ($role) {
            'entrada' => __('messages.carta.system_category_entrada'),
            'bebida' => __('messages.carta.system_category_bebida'),
            default => $role,
        };

        return [[
            'name' => $categoryName,
            'dishes' => $dishes->map(fn (MenuDish $dish): array => [
                'id' => $dish->id,
                'name' => $dish->name,
            ])->values()->all(),
        ]];
    }

    /** @return \Illuminate\Database\Eloquent\Builder<MenuDish> */
    private function roleAddonsQuery(string $role)
    {
        return MenuDish::query()
            ->where('available', true)
            ->where('type', 'simple')
            ->whereHas('category', fn ($query) => $query
                ->where('menu_role', $role)
                ->where('active', true));
    }
}
