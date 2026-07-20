<?php

namespace App\Http\Requests\Platform;

use App\Models\SubscriptionPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscriptionPaymentRequest extends FormRequest
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
        return [
            'subscription_id' => ['required', 'uuid', Rule::exists('subscriptions', 'id')],
            'tenant_id' => ['required', 'uuid', Rule::exists('tenants', 'id')],
            'concept' => ['required', Rule::in(SubscriptionPayment::CONCEPTS)],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'status' => ['required', Rule::in(SubscriptionPayment::STATUSES)],
            'gateway' => ['nullable', Rule::in(SubscriptionPayment::GATEWAYS)],
            'gateway_ref' => ['nullable', 'string', 'max:120'],
            'paid_at' => ['nullable', 'date'],
            'period_from' => ['nullable', 'date'],
            'period_to' => ['nullable', 'date', 'after_or_equal:period_from'],
        ];
    }

    private function ability(): string
    {
        return $this->route('subscription_payment') === null
            ? 'subscription_payments.create'
            : 'subscription_payments.update';
    }
}
