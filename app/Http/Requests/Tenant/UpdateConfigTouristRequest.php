<?php

namespace App\Http\Requests\Tenant;

use App\Models\RefCatalogItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConfigTouristRequest extends FormRequest
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
        return [
            'catalog_selection_ids' => ['array'],
            'catalog_selection_ids.*' => [
                'uuid',
                Rule::exists(RefCatalogItem::class, 'id')->where('active', true),
            ],
        ];
    }
}
