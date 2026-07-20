<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\AreaRequest;
use App\Http\Requests\Tenant\TableRequest;
use App\Models\Tenant\RstArea;
use App\Models\Tenant\RstTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Áreas y mesas del restaurante (subdominio del tenant). */
class MesasController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.tables.manage'), 403);

        $areas = RstArea::query()
            ->with(['tables' => fn ($q) => $q->orderBy('number')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (RstArea $area): array => [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'sort_order' => $area->sort_order,
                'active' => $area->active,
                'tables' => $area->tables->map(fn (RstTable $table): array => $this->serializeTable($table))->values(),
            ]);

        $tableCount = RstTable::query()->count();
        $activeTableCount = RstTable::query()->where('active', true)->count();

        return Inertia::render('mesas/index', [
            'areas' => $areas,
            'statuses' => RstTable::STATUSES,
            'shapes' => RstTable::SHAPES,
            'stats' => [
                'areas' => $areas->count(),
                'tables' => $tableCount,
                'active_tables' => $activeTableCount,
            ],
            'can' => [
                'manage' => $request->user()?->can('tenant.tables.manage'),
            ],
        ]);
    }

    public function storeArea(AreaRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $maxOrder = (int) RstArea::query()->max('sort_order');

        RstArea::query()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1),
            'active' => $data['active'] ?? true,
        ]);

        return back()->with('success', __('messages.mesas.area_created'));
    }

    public function updateArea(AreaRequest $request, RstArea $area): RedirectResponse
    {
        $data = $request->validated();

        $area->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? $area->sort_order,
            'active' => $data['active'] ?? $area->active,
        ]);

        return back()->with('success', __('messages.mesas.area_updated'));
    }

    public function destroyArea(Request $request, RstArea $area): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.tables.manage'), 403);

        $area->delete();

        return back()->with('success', __('messages.mesas.area_deleted'));
    }

    public function storeTable(TableRequest $request): RedirectResponse
    {
        $data = $request->validated();

        RstTable::query()->create([
            'area_id' => $data['area_id'],
            'number' => $data['number'],
            'capacity' => $data['capacity'],
            'capacity_max' => $data['capacity_max'] ?? null,
            'status' => $data['status'] ?? 'free',
            'shape' => $data['shape'] ?? null,
            'qr_token' => Str::lower(Str::random(40)),
            'reservable' => $data['reservable'] ?? true,
            'active' => $data['active'] ?? true,
        ]);

        return back()->with('success', __('messages.mesas.table_created'));
    }

    public function updateTable(TableRequest $request, RstTable $table): RedirectResponse
    {
        $data = $request->validated();

        $table->update([
            'area_id' => $data['area_id'],
            'number' => $data['number'],
            'capacity' => $data['capacity'],
            'capacity_max' => $data['capacity_max'] ?? null,
            'status' => $data['status'] ?? $table->status,
            'shape' => $data['shape'] ?? $table->shape,
            'reservable' => $data['reservable'] ?? $table->reservable,
            'active' => $data['active'] ?? $table->active,
        ]);

        return back()->with('success', __('messages.mesas.table_updated'));
    }

    public function destroyTable(Request $request, RstTable $table): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.tables.manage'), 403);

        $table->delete();

        return back()->with('success', __('messages.mesas.table_deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTable(RstTable $table): array
    {
        return [
            'id' => $table->id,
            'area_id' => $table->area_id,
            'number' => $table->number,
            'capacity' => $table->capacity,
            'capacity_max' => $table->capacity_max,
            'status' => $table->status,
            'shape' => $table->shape,
            'reservable' => $table->reservable,
            'active' => $table->active,
        ];
    }
}
