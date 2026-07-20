<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateDailyMenuSelectionsRequest;
use App\Http\Requests\Tenant\AddOrderItemRequest;
use App\Http\Requests\Tenant\OpenOrderRequest;
use App\Http\Requests\Tenant\UpdateOrderItemRequest;
use App\Models\Tenant\MenuCategory;
use App\Models\Tenant\MenuDish;
use App\Models\Tenant\Order;
use App\Models\Tenant\OrderItem;
use App\Models\Tenant\RstArea;
use App\Models\Tenant\RstTable;
use App\Services\Tenant\DailyMenuService;
use App\Services\Tenant\MenuStructureService;
use App\Services\Tenant\OrderService;
use App\Support\DateTime\ApiDateTime;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Comandas y pedidos en mesa (subdominio del tenant). */
class PedidosController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly DailyMenuService $dailyMenu,
        private readonly MenuStructureService $menuStructure,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $activeOrders = Order::query()
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->with([
                'table:id,number,area_id',
                'items:id,order_id,kitchen_status',
            ])
            ->get()
            ->keyBy('table_id');

        $areas = RstArea::query()
            ->with(['tables' => fn ($q) => $q->orderBy('number')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (RstArea $area): array => [
                'id' => $area->id,
                'name' => $area->name,
                'tables' => $area->tables->map(function (RstTable $table) use ($activeOrders): array {
                    $order = $activeOrders->get($table->id);
                    $readyCount = 0;
                    $allReady = false;

                    if ($order !== null && $order->status === 'kitchen') {
                        $readyCount = $order->items
                            ->where('kitchen_status', 'ready')
                            ->count();
                        $allReady = $order->items->isNotEmpty()
                            && $order->items->every(
                                fn (OrderItem $item): bool => in_array(
                                    $item->kitchen_status,
                                    ['ready', 'served'],
                                    true,
                                ),
                            );
                    }

                    return [
                        'id' => $table->id,
                        'number' => $table->number,
                        'capacity' => $table->capacity,
                        'status' => $table->status,
                        'active' => $table->active,
                        'open_order_id' => $order?->id,
                        'open_order_status' => $order?->status,
                        'open_order_total' => $order !== null ? (float) $order->total : null,
                        'kitchen_ready_count' => $readyCount,
                        'kitchen_all_ready' => $allReady,
                    ];
                })->values(),
            ]);

        $openCount = Order::query()
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->count();

        return Inertia::render('pedidos/index', [
            'areas' => $areas,
            'stats' => [
                'open_orders' => $openCount,
                'tables_with_order' => $activeOrders->count(),
            ],
            'can' => [
                'manage' => $request->user()?->can('tenant.orders.take'),
            ],
        ]);
    }

    public function store(OpenOrderRequest $request): RedirectResponse
    {
        $table = RstTable::query()->findOrFail($request->validated('table_id'));
        $order = $this->orders->openOrder($table, $request->user());

        return redirect()
            ->route('pedidos.show', $order)
            ->with('success', __('messages.pedidos.order_opened'));
    }

    public function show(Request $request, Order $pedido): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $pedido->load([
            'table.area',
            'waiter:id,name',
            'items' => fn ($q) => $q->with([
                'dish:id,includes_menu_addons,includes_drink_in_price,category_id',
                'dish.category:id,menu_role',
                'selections' => fn ($sq) => $sq->orderBy('sort_order'),
            ])->orderBy('created_at'),
        ]);

        $this->menuStructure->ensureSystemCategories();

        $categories = MenuCategory::query()
            ->with(['dishes' => fn ($q) => $q->where('available', true)->where('type', 'simple')->orderBy('sort_order')->orderBy('name')])
            ->where('active', true)
            ->where(function ($query): void {
                $query->whereIn('menu_role', MenuCategory::MENU_ROLES)
                    ->orWhereNull('menu_role');
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (MenuCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'dishes' => $category->dishes->map(fn (MenuDish $dish): array => [
                    'id' => $dish->id,
                    'name' => $dish->name,
                    'description' => $dish->description,
                    'price' => (float) $dish->price,
                    'image_url' => $dish->image_url,
                ])->values(),
            ])
            ->filter(fn (array $category): bool => $category['dishes']->isNotEmpty())
            ->values();

        return Inertia::render('pedidos/show', [
            'order' => $this->serializeOrder($pedido),
            'categories' => $categories,
            'menu_addons' => $this->dailyMenu->configForOrders(),
            'statuses' => Order::STATUSES,
            'kitchen_statuses' => OrderItem::KITCHEN_STATUSES,
            'can' => [
                'manage' => $request->user()?->can('tenant.orders.take'),
            ],
        ]);
    }

    public function addItem(AddOrderItemRequest $request, Order $pedido): RedirectResponse
    {
        $dish = MenuDish::query()->findOrFail($request->validated('dish_id'));

        $this->orders->addItem(
            $pedido,
            $dish,
            (int) $request->validated('quantity'),
            $request->validated('notes'),
        );

        return back()->with('success', __('messages.pedidos.item_added'));
    }

    public function updateItemSelections(
        UpdateDailyMenuSelectionsRequest $request,
        Order $pedido,
        OrderItem $item,
    ): RedirectResponse {
        abort_if($item->order_id !== $pedido->id, 404);

        $this->dailyMenu->updateItemSelections(
            $item,
            $request->validated('entrada_dish_ids'),
            $request->validated('bebida_dish_id'),
        );

        return back()->with('success', __('messages.pedidos.daily_menu_selections_saved'));
    }

    public function updateItem(
        UpdateOrderItemRequest $request,
        Order $pedido,
        OrderItem $item,
    ): RedirectResponse {
        abort_if($item->order_id !== $pedido->id, 404);

        $this->orders->updateItem(
            $item,
            (int) $request->validated('quantity'),
            $request->validated('notes'),
        );

        return back()->with('success', __('messages.pedidos.item_updated'));
    }

    public function removeItem(Request $request, Order $pedido, OrderItem $item): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);
        abort_if($item->order_id !== $pedido->id, 404);

        $this->orders->removeItem($item);

        return back()->with('success', __('messages.pedidos.item_removed'));
    }

    public function sendToKitchen(Request $request, Order $pedido): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $this->dailyMenu->assertOrderSelectionsComplete($pedido);
        $this->orders->sendToKitchen($pedido);

        return back()->with('success', __('messages.pedidos.sent_kitchen'));
    }

    public function markServed(Request $request, Order $pedido): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $this->dailyMenu->assertOrderSelectionsComplete($pedido);
        $this->orders->markServed($pedido);

        return back()->with('success', __('messages.pedidos.sent_to_caja'));
    }

    public function close(Request $request, Order $pedido): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $this->orders->close($pedido);

        return back();
    }

    public function cancel(Request $request, Order $pedido): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $this->orders->cancel($pedido);

        return redirect()
            ->route('pedidos.index')
            ->with('success', __('messages.pedidos.order_cancelled'));
    }

    public function openForTable(Request $request, RstTable $table): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.orders.take'), 403);

        $existing = $this->orders->findActiveOrderForTable($table);

        if ($existing !== null) {
            return redirect()->route('pedidos.show', $existing);
        }

        $order = $this->orders->openOrder($table, $request->user());

        return redirect()
            ->route('pedidos.show', $order)
            ->with('success', __('messages.pedidos.order_opened'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'number' => $order->number,
            'status' => $order->status,
            'type' => $order->type,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) $order->discount,
            'total' => (float) $order->total,
            'notes' => $order->notes,
            'opened_at' => ApiDateTime::toUtcIso($order->opened_at),
            'closed_at' => ApiDateTime::toUtcIso($order->closed_at),
            'is_editable' => $order->isEditable(),
            'table' => $order->table ? [
                'id' => $order->table->id,
                'number' => $order->table->number,
                'area_name' => $order->table->area?->name,
            ] : null,
            'waiter' => $order->waiter ? [
                'id' => $order->waiter->id,
                'name' => $order->waiter->name,
            ] : null,
            'items' => $order->items->map(fn (OrderItem $item): array => [
                'id' => $item->id,
                'item_type' => $item->item_type ?? 'simple',
                'dish_id' => $item->dish_id,
                'name' => $item->name_snapshot,
                'price' => (float) $item->price_snapshot,
                'quantity' => $item->quantity,
                'subtotal' => (float) $item->subtotal,
                'kitchen_status' => $item->kitchen_status,
                'notes' => $item->notes,
                'includes_menu_addons' => $item->item_type === 'daily_menu'
                    || ($item->dish !== null && $this->dailyMenu->isMenuDish($item->dish)),
                'includes_drink_in_price' => (bool) ($item->dish?->includes_drink_in_price ?? false),
                'selections_complete' => $this->dailyMenu->itemSelectionsComplete($item),
                'selections' => $item->selections->map(fn ($selection): array => [
                    'id' => $selection->id,
                    'dish_id' => $selection->dish_id,
                    'step_name' => $selection->step_name,
                    'step_slug' => $selection->step_slug,
                    'name' => $selection->name_snapshot,
                    'extra_price' => (float) $selection->extra_price,
                ])->values(),
            ])->values(),
        ];
    }
}
