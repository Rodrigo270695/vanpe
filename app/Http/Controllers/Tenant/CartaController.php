<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\MenuCategoryRequest;
use App\Http\Requests\Tenant\MenuDishRequest;
use App\Models\Tenant\MenuCategory;
use App\Models\Tenant\MenuDish;
use App\Services\Platform\PublicCatalogPublisher;
use App\Services\Tenant\DishImageStorage;
use App\Services\Tenant\MenuStructureService;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Categorías y platos de la carta (subdominio del tenant). */
class CartaController extends Controller
{
    public function __construct(
        private readonly DishImageStorage $dishImages,
        private readonly TenantManager $tenants,
        private readonly PublicCatalogPublisher $publisher,
        private readonly MenuStructureService $menuStructure,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.menu.manage'), 403);

        $this->menuStructure->ensureSystemCategories();

        $categories = MenuCategory::query()
            ->with(['dishes' => fn ($q) => $q->where('type', 'simple')->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (MenuCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
                'active' => $category->active,
                'menu_role' => $category->menu_role,
                'system_key' => $category->system_key,
                'is_system' => (bool) $category->is_system,
                'dishes' => $category->dishes->map(fn (MenuDish $dish): array => $this->serializeDish($dish))->values(),
            ]);

        $dishCount = MenuDish::query()->where('type', 'simple')->count();
        $availableCount = MenuDish::query()->where('type', 'simple')->where('available', true)->count();
        $publishedCount = MenuDish::query()->where('type', 'simple')->where('publish_in_app', true)->count();

        return Inertia::render('carta/index', [
            'categories' => $categories,
            'stats' => [
                'categories' => $categories->count(),
                'dishes' => $dishCount,
                'available_dishes' => $availableCount,
                'published_dishes' => $publishedCount,
            ],
            'can' => [
                'manage' => $request->user()?->can('tenant.menu.manage'),
            ],
        ]);
    }

    public function storeCategory(MenuCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $maxOrder = (int) MenuCategory::query()->max('sort_order');

        MenuCategory::query()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1),
            'active' => $data['active'] ?? true,
        ]);

        return back()->with('success', __('messages.carta.category_created'));
    }

    public function updateCategory(MenuCategoryRequest $request, MenuCategory $category): RedirectResponse
    {
        $data = $request->validated();

        $category->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? $category->sort_order,
            'active' => $data['active'] ?? $category->active,
        ]);

        return back()->with('success', __('messages.carta.category_updated'));
    }

    public function destroyCategory(Request $request, MenuCategory $category): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.menu.manage'), 403);

        if ($this->menuStructure->isSystemCategory($category)) {
            return back()->with('error', __('messages.carta.category_system_protected'));
        }

        $slug = (string) $this->tenants->tenant()?->slug;
        $category->load('dishes');

        $category->dishes->each(function (MenuDish $dish) use ($slug): void {
            $this->dishImages->deleteAllForDish($slug, (string) $dish->id, $dish->image_url);
        });

        $category->delete();

        return back()->with('success', __('messages.carta.category_deleted'));
    }

    public function storeDish(MenuDishRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $category = MenuCategory::query()->findOrFail($data['category_id']);
        $flags = $this->dishFlagsForCategory($category, $data);
        $maxOrder = (int) MenuDish::query()
            ->where('category_id', $data['category_id'])
            ->max('sort_order');

        $dish = MenuDish::query()->create([
            'category_id' => $data['category_id'],
            'type' => 'simple',
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'available' => $data['available'] ?? true,
            'publish_in_app' => $data['publish_in_app'] ?? false,
            'featured' => $data['featured'] ?? false,
            'includes_menu_addons' => $flags['includes_menu_addons'],
            'includes_drink_in_price' => $flags['includes_drink_in_price'],
            'is_drink' => $flags['is_drink'],
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1),
        ]);

        if ($request->hasFile('image')) {
            $slug = (string) $this->tenants->tenant()?->slug;
            $imageUrl = $this->dishImages->store($request->file('image'), $slug, $dish);
            $dish->update(['image_url' => $imageUrl]);
        }

        $this->publishMenuIfTenant();

        return back()->with('success', __('messages.carta.dish_created'));
    }

    public function updateDish(MenuDishRequest $request, MenuDish $dish): RedirectResponse
    {
        $data = $request->validated();
        $slug = (string) $this->tenants->tenant()?->slug;
        $category = MenuCategory::query()->findOrFail($data['category_id']);
        $flags = $this->dishFlagsForCategory($category, $data);

        $payload = [
            'category_id' => $data['category_id'],
            'type' => 'simple',
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'available' => $data['available'] ?? $dish->available,
            'publish_in_app' => $data['publish_in_app'] ?? $dish->publish_in_app,
            'featured' => $data['featured'] ?? $dish->featured,
            'includes_menu_addons' => $flags['includes_menu_addons'],
            'includes_drink_in_price' => $flags['includes_drink_in_price'],
            'is_drink' => $flags['is_drink'],
            'sort_order' => $data['sort_order'] ?? $dish->sort_order,
        ];

        if ($request->hasFile('image')) {
            $payload['image_url'] = $this->dishImages->store(
                $request->file('image'),
                $slug,
                $dish,
            );
        } elseif ($request->boolean('remove_image')) {
            $this->dishImages->deleteAllForDish($slug, (string) $dish->id, $dish->image_url);
            $payload['image_url'] = null;
        }

        $dish->update($payload);

        $this->publishMenuIfTenant();

        return back()->with('success', __('messages.carta.dish_updated'));
    }

    public function destroyDish(Request $request, MenuDish $dish): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.menu.manage'), 403);

        $this->dishImages->deleteAllForDish(
            (string) $this->tenants->tenant()?->slug,
            (string) $dish->id,
            $dish->image_url,
        );
        $dish->delete();

        $this->publishMenuIfTenant();

        return back()->with('success', __('messages.carta.dish_deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeDish(MenuDish $dish): array
    {
        return [
            'id' => $dish->id,
            'category_id' => $dish->category_id,
            'name' => $dish->name,
            'description' => $dish->description,
            'price' => (float) $dish->price,
            'image_url' => $dish->image_url,
            'available' => $dish->available,
            'publish_in_app' => $dish->publish_in_app,
            'featured' => $dish->featured,
            'sort_order' => $dish->sort_order,
            'includes_menu_addons' => (bool) $dish->includes_menu_addons,
            'includes_drink_in_price' => (bool) $dish->includes_drink_in_price,
            'is_drink' => (bool) $dish->is_drink,
        ];
    }

    private function publishMenuIfTenant(): void
    {
        $tenant = $this->tenants->tenant();

        if ($tenant !== null) {
            $this->publisher->maybePublish($tenant, ['carta']);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{includes_menu_addons: bool, includes_drink_in_price: bool, is_drink: bool}
     */
    private function dishFlagsForCategory(MenuCategory $category, array $data): array
    {
        $isMenu = $category->menu_role === 'menu';

        return [
            'includes_menu_addons' => $isMenu,
            'includes_drink_in_price' => $isMenu,
            'is_drink' => $category->menu_role === 'bebida',
        ];
    }
}
