<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConfigBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.settings.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $issuesReceipts = $this->boolean('issues_electronic_receipts');

        return [
            'currency' => ['required', 'string', Rule::in(['PEN', 'USD'])],
            'issues_electronic_receipts' => ['boolean'],
            'tax_rate' => [
                Rule::requiredIf($issuesReceipts),
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],
            'prices_include_tax' => ['boolean'],
            'emite_comprobantes_sunat' => ['boolean'],
            'apisunat_mode' => ['nullable', 'string', Rule::in(['sandbox', 'produccion'])],
            'apisunat_token' => ['nullable', 'string', 'min:10', 'max:500'],
            'clear_apisunat' => ['boolean'],
        ];
    }
}
