<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Order;
use App\Models\Tenant\OrderItem;
use App\Services\Tenant\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Tablero de cocina (comandas en preparación). */
class CocinaController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.kitchen.manage'), 403);

        $orders = Order::query()
            ->where('status', 'kitchen')
            ->with([
                'table.area:id,name',
                'waiter:id,name',
                'items' => fn ($query) => $query
                    ->whereIn('kitchen_status', ['preparing', 'ready'])
                    ->with(['selections' => fn ($selections) => $selections->orderBy('sort_order')])
                    ->orderBy('created_at'),
            ])
            ->orderBy('opened_at')
            ->get()
            ->map(fn (Order $order): array => $this->serializeKitchenOrder($order))
            ->filter(fn (array $order): bool => $order['items']->isNotEmpty())
            ->values();

        $preparing = 0;
        $ready = 0;

        foreach ($orders as $order) {
            foreach ($order['items'] as $item) {
                if ($item['kitchen_status'] === 'preparing') {
                    $preparing++;
                }
                if ($item['kitchen_status'] === 'ready') {
                    $ready++;
                }
            }
        }

        return Inertia::render('cocina/index', [
            'orders' => $orders,
            'stats' => [
                'orders' => $orders->count(),
                'preparing' => $preparing,
                'ready' => $ready,
            ],
            'can' => [
                'manage' => $request->user()?->can('tenant.kitchen.manage'),
            ],
        ]);
    }

    public function markItemReady(Request $request, OrderItem $item): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.kitchen.manage'), 403);

        $this->orders->markItemReady($item);

        return back()->with('success', __('messages.cocina.item_ready'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeKitchenOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'number' => $order->number,
            'opened_at' => $order->opened_at?->toIso8601String(),
            'notes' => $order->notes,
            'table' => $order->table ? [
                'number' => $order->table->number,
                'area_name' => $order->table->area?->name,
            ] : null,
            'waiter' => $order->waiter ? [
                'name' => $order->waiter->name,
            ] : null,
            'items' => $order->items->map(fn (OrderItem $item): array => [
                'id' => $item->id,
                'name' => $item->name_snapshot,
                'quantity' => $item->quantity,
                'kitchen_status' => $item->kitchen_status,
                'notes' => $item->notes,
                'selections' => $item->selections->map(fn ($selection): array => [
                    'step_slug' => $selection->step_slug,
                    'name' => $selection->name_snapshot,
                ])->values(),
            ])->values(),
        ];
    }
}
