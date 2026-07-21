<?php

namespace App\Http\Requests\Tenant;

use App\Support\RefCatalogTypes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCatalogProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) (
            $this->user()?->can('tenant.publication.manage')
            || $this->user()?->can('tenant.settings.manage')
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(RefCatalogTypes::RESTAURANT)],
            'suggested_name' => ['required', 'string', 'min:2', 'max:100'],
        ];
    }
}
