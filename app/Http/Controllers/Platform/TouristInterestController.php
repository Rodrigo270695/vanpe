<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\TouristInterestCategory;
use App\Services\Tourist\TouristInterestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Amarres entre intereses turistas y catálogo tenant / categorías de centros. */
class TouristInterestController extends Controller
{
    public function __construct(
        private readonly TouristInterestService $interests,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('catalog.view'), 403);

        $payload = $this->interests->adminIndexPayload();

        return Inertia::render('catalog/interests', [
            ...$payload,
            'can' => [
                'update' => $request->user()?->can('catalog.update'),
            ],
        ]);
    }

    public function syncCatalogItems(Request $request, TouristInterestCategory $category): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('catalog.update'), 403);

        $validated = $request->validate([
            'catalog_item_ids' => ['present', 'array'],
            'catalog_item_ids.*' => ['uuid'],
        ]);

        /** @var list<string> $ids */
        $ids = array_values(array_unique($validated['catalog_item_ids']));

        $this->interests->syncCategoryCatalogItems($category, $ids);

        return back()->with('success', 'Amarres de catálogo actualizados.');
    }

    public function syncTourCategories(Request $request, TouristInterestCategory $category): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('catalog.update'), 403);

        $validated = $request->validate([
            'tour_category_ids' => ['present', 'array'],
            'tour_category_ids.*' => ['uuid'],
        ]);

        /** @var list<string> $ids */
        $ids = array_values(array_unique($validated['tour_category_ids']));

        $this->interests->syncCategoryTourCategories($category, $ids);

        return back()->with('success', 'Amarres de centros turísticos actualizados.');
    }
}
