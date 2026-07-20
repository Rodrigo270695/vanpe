<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\MenuDish;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDailyMenuSelectionsRequest extends FormRequest
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
            'entrada_dish_ids' => ['required', 'array', 'min:1', 'max:2'],
            'entrada_dish_ids.*' => [
                'required',
                'uuid',
                Rule::exists(MenuDish::class, 'id')->whereNull('deleted_at'),
            ],
            'bebida_dish_id' => [
                'nullable',
                'uuid',
                Rule::exists(MenuDish::class, 'id')->whereNull('deleted_at'),
            ],
        ];
    }
}
