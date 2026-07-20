<?php

namespace App\Http\Requests\Platform;

use App\Models\RefCatalogItem;
use App\Support\RefCatalogTypes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ability = $this->isMethod('post') ? 'catalog.create' : 'catalog.update';

        return (bool) $this->user()?->can($ability);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $item = $this->route('catalogItem');

        return [
            'type' => ['required', 'string', Rule::in(RefCatalogTypes::ALL)],
            'slug' => [
                'required',
                'string',
                'max:80',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('ref_catalog_items', 'slug')
                    ->where('type', $this->input('type'))
                    ->ignore($item?->id),
            ],
            'name_es' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:40'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:32767'],
            'active' => ['boolean'],
        ];
    }
}
