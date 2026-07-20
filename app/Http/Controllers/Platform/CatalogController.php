<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\CatalogItemRequest;
use App\Http\Requests\Platform\CatalogProposalRejectRequest;
use App\Models\RefCatalogItem;
use App\Models\RefCatalogProposal;
use App\Services\Platform\RefCatalogService;
use App\Support\RefCatalogTypes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Catálogo turístico global + aprobación de propuestas (superadmin). */
class CatalogController extends Controller
{
    public function __construct(
        private readonly RefCatalogService $catalog,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('catalog.view'), 403);

        $items = RefCatalogItem::query()
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name_es')
            ->get()
            ->map(fn (RefCatalogItem $item): array => $item->toCatalogArray());

        $proposals = RefCatalogProposal::query()
            ->with(['tenant:id,slug,nombre_comercial', 'reviewer:id,name'])
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn (RefCatalogProposal $row): array => [
                'id' => $row->id,
                'tenant_id' => $row->tenant_id,
                'tenant_name' => $row->tenant?->nombre_comercial,
                'tenant_slug' => $row->tenant?->slug,
                'type' => $row->type,
                'suggested_name' => $row->suggested_name,
                'status' => $row->status,
                'catalog_item_id' => $row->catalog_item_id,
                'reviewed_by_name' => $row->reviewer?->name,
                'reviewed_at' => $row->reviewed_at?->toIso8601String(),
                'rejection_reason' => $row->rejection_reason,
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        $pendingCount = $proposals->where('status', RefCatalogProposal::STATUS_PENDING)->count();

        return Inertia::render('catalog/index', [
            'items' => $items,
            'proposals' => $proposals,
            'types' => RefCatalogTypes::ALL,
            'type_labels' => RefCatalogTypes::labels(),
            'pending_count' => $pendingCount,
            'can' => [
                'create' => $request->user()?->can('catalog.create'),
                'update' => $request->user()?->can('catalog.update'),
                'delete' => $request->user()?->can('catalog.delete'),
                'proposals' => $request->user()?->can('catalog.proposals'),
            ],
        ]);
    }

    public function store(CatalogItemRequest $request): RedirectResponse
    {
        $data = $request->validated();

        RefCatalogItem::query()->create([
            'type' => $data['type'],
            'slug' => $data['slug'],
            'name_es' => $data['name_es'],
            'name_en' => $data['name_en'],
            'icon' => $data['icon'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'active' => $data['active'] ?? true,
        ]);

        return back()->with('success', __('messages.catalog.item_created'));
    }

    public function update(CatalogItemRequest $request, RefCatalogItem $catalogItem): RedirectResponse
    {
        $data = $request->validated();

        $catalogItem->update([
            'type' => $data['type'],
            'slug' => $data['slug'],
            'name_es' => $data['name_es'],
            'name_en' => $data['name_en'],
            'icon' => $data['icon'] ?? null,
            'sort_order' => $data['sort_order'] ?? $catalogItem->sort_order,
            'active' => $data['active'] ?? $catalogItem->active,
        ]);

        return back()->with('success', __('messages.catalog.item_updated'));
    }

    public function destroy(Request $request, RefCatalogItem $catalogItem): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('catalog.delete'), 403);

        $catalogItem->delete();

        return back()->with('success', __('messages.catalog.item_deleted'));
    }

    public function approveProposal(Request $request, RefCatalogProposal $proposal): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('catalog.proposals'), 403);

        try {
            $this->catalog->approveProposal($proposal, $request->user());
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['proposal' => $e->getMessage()]);
        }

        return back()->with('success', __('messages.catalog.proposal_approved'));
    }

    public function rejectProposal(
        CatalogProposalRejectRequest $request,
        RefCatalogProposal $proposal,
    ): RedirectResponse {
        try {
            $this->catalog->rejectProposal(
                $proposal,
                $request->user(),
                $request->validated('rejection_reason'),
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['proposal' => $e->getMessage()]);
        }

        return back()->with('success', __('messages.catalog.proposal_rejected'));
    }
}
