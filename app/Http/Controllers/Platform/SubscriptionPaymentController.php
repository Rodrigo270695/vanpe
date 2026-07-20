<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\SubscriptionPaymentRequest;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/** Historial de cobros de suscripción (solo plataforma / superadmin). */
class SubscriptionPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('subscription_payments.view'), 403);

        $payments = SubscriptionPayment::query()
            ->with([
                'tenant:id,slug,nombre_comercial',
                'subscription.plan:id,name,code',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (SubscriptionPayment $row): array => [
                'id' => $row->id,
                'subscription_id' => $row->subscription_id,
                'tenant_id' => $row->tenant_id,
                'tenant_name' => $row->tenant?->nombre_comercial,
                'tenant_slug' => $row->tenant?->slug,
                'plan_name' => $row->subscription?->plan?->name,
                'plan_code' => $row->subscription?->plan?->code,
                'concept' => $row->concept,
                'amount' => $row->amount,
                'currency' => $row->currency,
                'status' => $row->status,
                'gateway' => $row->gateway,
                'gateway_ref' => $row->gateway_ref,
                'paid_at' => $row->paid_at?->toIso8601String(),
                'period_from' => $row->period_from?->toDateString(),
                'period_to' => $row->period_to?->toDateString(),
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        $subscriptions = Subscription::query()
            ->with(['tenant:id,nombre_comercial,slug', 'plan:id,name,code'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Subscription $sub): array => [
                'id' => $sub->id,
                'tenant_id' => $sub->tenant_id,
                'tenant_name' => $sub->tenant?->nombre_comercial,
                'tenant_slug' => $sub->tenant?->slug,
                'plan_name' => $sub->plan?->name,
                'plan_code' => $sub->plan?->code,
            ]);

        $tenants = Tenant::query()
            ->orderBy('nombre_comercial')
            ->get(['id', 'nombre_comercial', 'slug']);

        return Inertia::render('subscription-payments/index', [
            'payments' => $payments,
            'subscriptions' => $subscriptions,
            'tenants' => $tenants,
            'concepts' => SubscriptionPayment::CONCEPTS,
            'statuses' => SubscriptionPayment::STATUSES,
            'gateways' => SubscriptionPayment::GATEWAYS,
            'can' => [
                'create' => $request->user()?->can('subscription_payments.create'),
                'update' => $request->user()?->can('subscription_payments.update'),
                'delete' => $request->user()?->can('subscription_payments.delete'),
            ],
        ]);
    }

    public function store(SubscriptionPaymentRequest $request): RedirectResponse
    {
        SubscriptionPayment::query()->create($this->enrich($request->validated()));

        return back()->with('success', __('messages.subscription_payments.created'));
    }

    public function update(
        SubscriptionPaymentRequest $request,
        SubscriptionPayment $subscriptionPayment,
    ): RedirectResponse {
        $subscriptionPayment->update($this->enrich($request->validated(), $subscriptionPayment));

        return back()->with('success', __('messages.subscription_payments.updated'));
    }

    public function destroy(Request $request, SubscriptionPayment $subscriptionPayment): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('subscription_payments.delete'), 403);

        $subscriptionPayment->delete();

        return back()->with('success', __('messages.subscription_payments.deleted'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function enrich(array $data, ?SubscriptionPayment $existing = null): array
    {
        if (($data['status'] ?? '') === 'paid') {
            $data['paid_at'] = isset($data['paid_at']) && $data['paid_at'] !== ''
                ? Carbon::parse($data['paid_at'])
                : ($existing?->paid_at ?? now());
        } else {
            $data['paid_at'] = null;
        }

        return $data;
    }
}
