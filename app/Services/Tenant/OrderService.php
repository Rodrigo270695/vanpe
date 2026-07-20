<?php

namespace App\Services\Tenant;

use App\Models\Tenant\MenuDish;
use App\Models\Tenant\Order;
use App\Models\Tenant\OrderItem;
use App\Models\Tenant\RstTable;
use App\Models\Tenant\User;
use App\Tenancy\TenantManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly PushNotificationService $push,
    ) {}
    public function openOrder(RstTable $table, User $waiter): Order
    {
        if (! $table->active) {
            throw ValidationException::withMessages([
                'table_id' => __('messages.pedidos.table_inactive'),
            ]);
        }

        $existing = $this->findActiveOrderForTable($table);

        if ($existing !== null) {
            throw ValidationException::withMessages([
                'table_id' => __('messages.pedidos.table_has_order'),
            ]);
        }

        return DB::transaction(function () use ($table, $waiter): Order {
            $order = Order::query()->create([
                'number' => $this->nextDailyNumber(),
                'table_id' => $table->id,
                'waiter_id' => $waiter->id,
                'type' => 'dine_in',
                'status' => 'open',
                'opened_at' => now(),
            ]);

            if (in_array($table->status, ['free', 'reserved'], true)) {
                $table->update(['status' => 'occupied']);
            }

            return $order;
        });
    }

    public function addItem(Order $order, MenuDish $dish, int $quantity, ?string $notes = null): OrderItem
    {
        $this->assertEditable($order);

        if (! $dish->available) {
            throw ValidationException::withMessages([
                'dish_id' => __('messages.pedidos.dish_unavailable'),
            ]);
        }

        if ($dish->isCombo()) {
            throw ValidationException::withMessages([
                'dish_id' => __('messages.pedidos.dish_unavailable'),
            ]);
        }

        $dish->loadMissing('category:id,menu_role');
        $isDailyMenu = $dish->category?->menu_role === 'menu'
            || (bool) $dish->includes_menu_addons;

        return DB::transaction(function () use ($order, $dish, $quantity, $notes, $isDailyMenu): OrderItem {
            $item = OrderItem::query()->create([
                'order_id' => $order->id,
                'item_type' => $isDailyMenu ? 'daily_menu' : 'simple',
                'dish_id' => $dish->id,
                'name_snapshot' => $dish->name,
                'price_snapshot' => $dish->price,
                'quantity' => $quantity,
                'subtotal' => bcmul((string) $dish->price, (string) $quantity, 2),
                'kitchen_status' => 'pending',
                'notes' => $notes,
            ]);

            $this->recalculate($order);

            return $item;
        });
    }

    public function updateItem(OrderItem $item, int $quantity, ?string $notes = null): void
    {
        $order = $item->order;

        $this->assertEditable($order);

        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => __('messages.pedidos.quantity_min'),
            ]);
        }

        DB::transaction(function () use ($item, $order, $quantity, $notes): void {
            $item->update([
                'quantity' => $quantity,
                'subtotal' => bcmul((string) $item->price_snapshot, (string) $quantity, 2),
                'notes' => $notes,
            ]);

            $this->recalculate($order);
        });
    }

    public function removeItem(OrderItem $item): void
    {
        $order = $item->order;

        $this->assertEditable($order);

        DB::transaction(function () use ($item, $order): void {
            $item->delete();
            $this->recalculate($order);
        });
    }

    public function sendToKitchen(Order $order): void
    {
        if ($order->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => __('messages.pedidos.invalid_transition'),
            ]);
        }

        if ($order->items()->count() === 0) {
            throw ValidationException::withMessages([
                'items' => __('messages.pedidos.empty_order'),
            ]);
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => 'kitchen']);
            $order->items()
                ->where('kitchen_status', 'pending')
                ->update(['kitchen_status' => 'preparing']);
        });

        $order->refresh();
        $order->loadMissing('table');
        $this->push->notifyKitchenNewOrder($order, auth()->user());
    }

    public function markServed(Order $order): void
    {
        if (! in_array($order->status, ['open', 'kitchen'], true)) {
            throw ValidationException::withMessages([
                'status' => __('messages.pedidos.invalid_transition'),
            ]);
        }

        if ($order->items()->count() === 0) {
            throw ValidationException::withMessages([
                'items' => __('messages.pedidos.empty_order'),
            ]);
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => 'served']);
            $order->items()
                ->whereIn('kitchen_status', ['pending', 'preparing', 'ready'])
                ->update(['kitchen_status' => 'served']);
        });

        $order->refresh();
        $order->loadMissing('table');
        $this->push->notifyCashierOrderToPay($order, auth()->user());
    }

    public function markItemReady(OrderItem $item): void
    {
        $order = $item->order;

        if ($order->status !== 'kitchen') {
            throw ValidationException::withMessages([
                'status' => __('messages.cocina.order_not_in_kitchen'),
            ]);
        }

        if ($item->kitchen_status !== 'preparing') {
            throw ValidationException::withMessages([
                'item' => __('messages.cocina.item_not_preparing'),
            ]);
        }

        $item->update(['kitchen_status' => 'ready']);

        $this->push->notifyWaiterItemReady($item->fresh(), auth()->user());
    }

    public function close(Order $order): void
    {
        throw ValidationException::withMessages([
            'status' => __('messages.pedidos.close_in_caja'),
        ]);
    }

    public function cancel(Order $order): void
    {
        if (! in_array($order->status, Order::ACTIVE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => __('messages.pedidos.invalid_transition'),
            ]);
        }

        $wasInKitchen = $order->status === 'kitchen';

        DB::transaction(function () use ($order): void {
            $order->update([
                'status' => 'cancelled',
                'closed_at' => now(),
            ]);

            $order->items()->update(['kitchen_status' => 'cancelled']);

            if ($order->table_id !== null) {
                $this->syncTableStatus($order->table);
            }
        });

        if ($wasInKitchen) {
            $order->refresh();
            $order->loadMissing('table');
            $this->push->notifyKitchenOrderCancelled($order, auth()->user());
        }
    }

    public function findActiveOrderForTable(RstTable $table): ?Order
    {
        return Order::query()
            ->where('table_id', $table->id)
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->latest('opened_at')
            ->first();
    }

    private function assertEditable(Order $order): void
    {
        if (! $order->isEditable()) {
            throw ValidationException::withMessages([
                'status' => __('messages.pedidos.order_not_editable'),
            ]);
        }
    }

    private function recalculate(Order $order): void
    {
        $subtotal = $order->items()->sum('subtotal');
        $discount = (float) $order->discount;
        $total = max(0, $subtotal - $discount);

        $order->update([
            'subtotal' => $subtotal,
            'total' => $total,
        ]);
    }

    private function syncTableStatus(?RstTable $table): void
    {
        if ($table === null) {
            return;
        }

        $hasActive = Order::query()
            ->where('table_id', $table->id)
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->exists();

        if (! $hasActive && $table->status === 'occupied') {
            $table->update(['status' => 'free']);
        }
    }

    private function nextDailyNumber(): string
    {
        $timezone = app(TenantManager::class)->tenant()?->timezone ?: 'America/Lima';
        $today = now($timezone)->toDateString();

        $count = Order::query()
            ->whereDate('opened_at', $today)
            ->count();

        return str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);
    }
}
