<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PlanRequest;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Gestión de planes SaaS (solo plataforma / superadmin). */
class PlanController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('plans.view'), 403);

        $plans = Plan::query()
            ->withCount(['features', 'subscriptions'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Plan $plan): array => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'description' => $plan->description,
                'badge' => $plan->badge,
                'color_hex' => $plan->color_hex,
                'monthly_price' => $plan->monthly_price,
                'yearly_price' => $plan->yearly_price,
                'trial_days' => $plan->trial_days,
                'reservation_commission' => $plan->reservation_commission,
                'sort_order' => $plan->sort_order,
                'is_public' => $plan->is_public,
                'active' => $plan->active,
                'features_count' => $plan->features_count,
                'subscriptions_count' => $plan->subscriptions_count,
                'created_at' => $plan->created_at?->toIso8601String(),
            ]);

        return Inertia::render('planes/index', [
            'plans' => $plans,
            'can' => [
                'create' => $request->user()?->can('plans.create'),
                'update' => $request->user()?->can('plans.update'),
                'delete' => $request->user()?->can('plans.delete'),
            ],
        ]);
    }

    public function store(PlanRequest $request): RedirectResponse
    {
        $data = $this->withGeneratedFields($request->validated());

        Plan::query()->create($data);

        return back()->with('success', __('messages.plans.created'));
    }

    public function update(PlanRequest $request, Plan $plan): RedirectResponse
    {
        $data = $this->withGeneratedFields($request->validated(), $plan);
        $plan->update($data);

        return back()->with('success', __('messages.plans.updated'));
    }

    public function destroy(Request $request, Plan $plan): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('plans.delete'), 403);

        if ($plan->subscriptions()->exists()) {
            return back()->with('error', __('messages.plans.delete_has_subscriptions'));
        }

        $plan->delete();

        return back()->with('success', __('messages.plans.deleted'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withGeneratedFields(array $data, ?Plan $existing = null): array
    {
        if ($existing === null) {
            $data['sort_order'] = ((int) Plan::query()->max('sort_order')) + 1;
        }

        if ($existing === null || $existing->name !== ($data['name'] ?? '')) {
            $data['code'] = $this->uniqueCodeFromName(
                (string) ($data['name'] ?? ''),
                $existing?->id,
            );
        }

        if (empty($data['color_hex'])) {
            $data['color_hex'] = match ($data['code'] ?? '') {
                'free' => '#94a3b8',
                'starter' => '#4a7ab8',
                'pro' => '#0744a9',
                'premium' => '#2d4a73',
                default => '#0744a9',
            };
        }

        return $data;
    }

    private function uniqueCodeFromName(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'plan';
        }

        $code = $base;
        $suffix = 2;

        while (
            Plan::query()
                ->where('code', $code)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $code = "{$base}-{$suffix}";
            $suffix++;
        }

        return $code;
    }
}
