<?php

namespace App\Http\Requests\Platform;

use App\Support\PlanFeatureCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlanFeatureRequest extends FormRequest
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
        $featureId = $this->route('plan_feature')?->id;
        $catalog = PlanFeatureCatalog::all();
        $featureKey = (string) $this->input('feature');
        $type = $catalog[$featureKey]['type'] ?? 'string';

        $valueRules = match ($type) {
            'int' => ['nullable', 'integer', 'min:-1'],
            'bool' => ['nullable', 'boolean'],
            default => [
                'nullable',
                'string',
                'max:50',
                Rule::in($catalog[$featureKey]['options'] ?? []),
            ],
        };

        return [
            'plan_id' => ['required', 'uuid', Rule::exists('plans', 'id')],
            'feature' => [
                'required',
                'string',
                Rule::in(PlanFeatureCatalog::keys()),
                Rule::unique('plan_features', 'feature')
                    ->where('plan_id', $this->input('plan_id'))
                    ->ignore($featureId),
            ],
            'value_int' => $type === 'int' ? array_merge(['required'], array_slice($valueRules, 1)) : ['nullable'],
            'value_bool' => $type === 'bool' ? ['required', 'boolean'] : ['nullable'],
            'value_str' => $type === 'string' ? array_merge(['required'], array_slice($valueRules, 1)) : ['nullable'],
        ];
    }

    private function ability(): string
    {
        return $this->route('plan_feature') === null
            ? 'plan_features.create'
            : 'plan_features.update';
    }
}
