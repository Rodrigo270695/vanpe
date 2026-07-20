<?php

namespace App\Http\Requests\Platform;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can($this->ability());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $subscriptionId = $this->route('subscription')?->id;

        return [
            'tenant_id' => [
                'required',
                'uuid',
                Rule::exists('tenants', 'id'),
                Rule::unique('subscriptions', 'tenant_id')->ignore($subscriptionId),
            ],
            'plan_id' => ['required', 'uuid', Rule::exists('plans', 'id')],
            'status' => ['required', Rule::in(Subscription::STATUSES)],
            'billing_cycle' => ['required', Rule::in(Subscription::BILLING_CYCLES)],
            'current_price' => ['nullable', 'numeric', 'min:0'],
            'reservation_commission' => ['nullable', 'numeric', 'min:0'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'auto_renew' => ['boolean'],
        ];
    }

    private function ability(): string
    {
        return $this->route('subscription') === null
            ? 'subscriptions.create'
            : 'subscriptions.update';
    }
}
