<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\MenuCategory;
use App\Models\Tenant\MenuDish;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuDishRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.menu.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid', Rule::exists(MenuCategory::class, 'id')],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:400'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'available' => ['sometimes', 'boolean'],
            'publish_in_app' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'includes_menu_addons' => ['sometimes', 'boolean'],
            'includes_drink_in_price' => ['sometimes', 'boolean'],
            'is_drink' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:32767'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'category_id' => __('messages.carta.field_category'),
            'name' => __('messages.carta.field_dish_name'),
            'description' => __('messages.carta.field_dish_description'),
            'price' => __('messages.carta.field_price'),
            'image' => __('messages.carta.field_image'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.required' => __('messages.carta.validation_category_required'),
            'name.required' => __('messages.carta.validation_name_required'),
            'price.required' => __('messages.carta.validation_price_required'),
            'price.numeric' => __('messages.carta.validation_price_numeric'),
            'image.image' => __('messages.carta.validation_image_type'),
            'image.mimes' => __('messages.carta.validation_image_type'),
            'image.max' => __('messages.carta.validation_image_size'),
        ];
    }
}
