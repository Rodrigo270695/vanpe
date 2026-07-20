<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class PlanRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:2000'],
            'badge' => ['nullable', 'string', 'max:50'],
            'color_hex' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'trial_days' => ['required', 'integer', 'min:0', 'max:365'],
            'reservation_commission' => ['required', 'numeric', 'min:0'],
            'is_public' => ['boolean'],
            'active' => ['boolean'],
        ];
    }

    private function ability(): string
    {
        return $this->route('plan') === null ? 'plans.create' : 'plans.update';
    }
}
