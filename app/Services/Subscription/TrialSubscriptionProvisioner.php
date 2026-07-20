<?php

namespace App\Services\Subscription;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;

/**
 * Crea la suscripción inicial de un restaurante recién provisionado.
 */
class TrialSubscriptionProvisioner
{
    public function provisionForTenant(Tenant $tenant, ?string $planCode = null): Subscription
    {
        if ($tenant->subscription()->exists()) {
            return $tenant->subscription;
        }

        $plan = $this->resolvePlan($planCode);
        $trialDays = (int) $plan->trial_days;
        $isTrial = $trialDays > 0;

        $periodStart = now();
        $periodEnd = $isTrial
            ? $periodStart->copy()->addDays($trialDays)
            : $periodStart->copy()->addMonth();

        $tenant->update([
            'trial_ends_at' => $isTrial ? $periodEnd : null,
        ]);

        return Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => $isTrial ? 'trial' : 'active',
            'billing_cycle' => 'monthly',
            'current_price' => $plan->monthly_price,
            'reservation_commission' => $plan->reservation_commission,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'auto_renew' => true,
        ]);
    }

    private function resolvePlan(?string $planCode): Plan
    {
        $code = $planCode ?? (string) config('saas.default_plan_code', 'starter');

        $plan = Plan::query()
            ->where('code', $code)
            ->where('active', true)
            ->first();

        if ($plan) {
            return $plan;
        }

        return Plan::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->firstOrFail();
    }
}
