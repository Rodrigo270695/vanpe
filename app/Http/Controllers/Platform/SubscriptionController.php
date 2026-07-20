<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\SubscriptionRequest;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/** Suscripciones tenant ↔ plan (solo plataforma / superadmin). */
class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('subscriptions.view'), 403);

        $subscriptions = Subscription::query()
            ->with(['tenant:id,slug,nombre_comercial,estado', 'plan:id,name,code'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Subscription $sub): array => [
                'id' => $sub->id,
                'tenant_id' => $sub->tenant_id,
                'tenant_name' => $sub->tenant?->nombre_comercial,
                'tenant_slug' => $sub->tenant?->slug,
                'tenant_status' => $sub->tenant?->estado,
                'plan_id' => $sub->plan_id,
                'plan_name' => $sub->plan?->name,
                'plan_code' => $sub->plan?->code,
                'status' => $sub->status,
                'billing_cycle' => $sub->billing_cycle,
                'current_price' => $sub->current_price,
                'reservation_commission' => $sub->reservation_commission,
                'period_start' => $sub->period_start?->toIso8601String(),
                'period_end' => $sub->period_end?->toIso8601String(),
                'auto_renew' => $sub->auto_renew,
                'cancelled_at' => $sub->cancelled_at?->toIso8601String(),
                'created_at' => $sub->created_at?->toIso8601String(),
            ]);

        $tenants = Tenant::query()
            ->orderBy('nombre_comercial')
            ->get(['id', 'nombre_comercial', 'slug']);

        $plans = Plan::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'code', 'monthly_price', 'yearly_price', 'reservation_commission', 'trial_days']);

        return Inertia::render('subscriptions/index', [
            'subscriptions' => $subscriptions,
            'tenants' => $tenants,
            'plans' => $plans,
            'statuses' => Subscription::STATUSES,
            'billingCycles' => Subscription::BILLING_CYCLES,
            'can' => [
                'create' => $request->user()?->can('subscriptions.create'),
                'update' => $request->user()?->can('subscriptions.update'),
                'delete' => $request->user()?->can('subscriptions.delete'),
            ],
        ]);
    }

    public function store(SubscriptionRequest $request): RedirectResponse
    {
        $data = $this->enrich($request->validated());
        Subscription::query()->create($data);

        return back()->with('success', __('messages.subscriptions.created'));
    }

    public function update(SubscriptionRequest $request, Subscription $subscription): RedirectResponse
    {
        $data = $this->enrich($request->validated(), $subscription);
        $subscription->update($data);

        return back()->with('success', __('messages.subscriptions.updated'));
    }

    public function destroy(Request $request, Subscription $subscription): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('subscriptions.delete'), 403);

        $subscription->delete();

        return back()->with('success', __('messages.subscriptions.deleted'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function enrich(array $data, ?Subscription $existing = null): array
    {
        /** @var Plan $plan */
        $plan = Plan::query()->findOrFail($data['plan_id']);

        if (! isset($data['current_price']) || $data['current_price'] === null || $data['current_price'] === '') {
            $data['current_price'] = $data['billing_cycle'] === 'yearly'
                ? ($plan->yearly_price ?? $plan->monthly_price * 12)
                : $plan->monthly_price;
        }

        if (! isset($data['reservation_commission']) || $data['reservation_commission'] === null) {
            $data['reservation_commission'] = $plan->reservation_commission;
        }

        $data['period_start'] = Carbon::parse($data['period_start']);
        $data['period_end'] = Carbon::parse($data['period_end']);

        if (($data['status'] ?? '') === 'cancelled' && ! $existing?->cancelled_at) {
            $data['cancelled_at'] = now();
        }

        if (($data['status'] ?? '') !== 'cancelled') {
            $data['cancelled_at'] = null;
        }

        return $data;
    }
}
