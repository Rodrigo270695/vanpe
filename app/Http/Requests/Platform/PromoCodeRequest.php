<?php

namespace App\Http\Requests\Platform;

use App\Models\PromoCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromoCodeRequest extends FormRequest
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
        $promoCodeId = $this->route('promo_code')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('promo_codes', 'code')->ignore($promoCodeId),
            ],
            'description' => ['nullable', 'string', 'max:150'],
            'type' => ['required', Rule::in(PromoCode::TYPES)],
            'value' => ['required', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'active' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $maxUses = $this->input('max_uses');

        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code'))),
            'max_uses' => $maxUses === '' || $maxUses === null ? null : $maxUses,
        ]);
    }

    private function ability(): string
    {
        return $this->route('promo_code') === null
            ? 'promo_codes.create'
            : 'promo_codes.update';
    }
}
