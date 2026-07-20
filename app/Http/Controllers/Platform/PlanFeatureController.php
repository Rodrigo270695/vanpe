<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PlanFeatureRequest;
use App\Models\Plan;
use App\Models\PlanFeature;
use App\Support\PlanFeatureCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Features por plan (solo plataforma / superadmin). */
class PlanFeatureController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('plan_features.view'), 403);

        $features = PlanFeature::query()
            ->with('plan:id,name,code')
            ->orderBy('plan_id')
            ->orderBy('feature')
            ->get()
            ->map(fn (PlanFeature $row): array => [
                'id' => $row->id,
                'plan_id' => $row->plan_id,
                'plan_name' => $row->plan?->name,
                'plan_code' => $row->plan?->code,
                'feature' => $row->feature,
                'feature_label' => (string) trans("messages.plan_features.catalog.{$row->feature}"),
                'value_int' => $row->value_int,
                'value_bool' => $row->value_bool,
                'value_str' => $row->value_str,
                'display_value' => $this->displayValue($row),
            ]);

        $plans = Plan::query()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'code']);

        return Inertia::render('plan-features/index', [
            'features' => $features,
            'plans' => $plans,
            'catalog' => PlanFeatureCatalog::forFrontend(),
            'can' => [
                'create' => $request->user()?->can('plan_features.create'),
                'update' => $request->user()?->can('plan_features.update'),
                'delete' => $request->user()?->can('plan_features.delete'),
            ],
        ]);
    }

    public function store(PlanFeatureRequest $request): RedirectResponse
    {
        PlanFeature::query()->create($this->payload($request->validated()));

        return back()->with('success', __('messages.plan_features.created'));
    }

    public function update(PlanFeatureRequest $request, PlanFeature $planFeature): RedirectResponse
    {
        $planFeature->update($this->payload($request->validated()));

        return back()->with('success', __('messages.plan_features.updated'));
    }

    public function destroy(Request $request, PlanFeature $planFeature): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('plan_features.delete'), 403);

        $planFeature->delete();

        return back()->with('success', __('messages.plan_features.deleted'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function payload(array $data): array
    {
        $catalog = PlanFeatureCatalog::all();
        $type = $catalog[$data['feature']]['type'] ?? 'string';

        return [
            'plan_id' => $data['plan_id'],
            'feature' => $data['feature'],
            'value_int' => $type === 'int' ? $data['value_int'] : null,
            'value_bool' => $type === 'bool' ? $data['value_bool'] : null,
            'value_str' => $type === 'string' ? $data['value_str'] : null,
        ];
    }

    private function displayValue(PlanFeature $row): string
    {
        $catalog = PlanFeatureCatalog::all();
        $type = $catalog[$row->feature]['type'] ?? 'string';

        return match ($type) {
            'int' => $row->value_int === -1
                ? (string) __('messages.plan_features.unlimited')
                : (string) $row->value_int,
            'bool' => $row->value_bool
                ? (string) __('messages.plan_features.yes')
                : (string) __('messages.plan_features.no'),
            default => (string) ($row->value_str ?? '—'),
        };
    }
}
