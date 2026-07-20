<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\MenuDish;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddOrderItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.orders.take');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'dish_id' => [
                'required',
                'uuid',
                Rule::exists(MenuDish::class, 'id')->whereNull('deleted_at'),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'notes' => ['nullable', 'string', 'max:200'],
        ];
    }
}
