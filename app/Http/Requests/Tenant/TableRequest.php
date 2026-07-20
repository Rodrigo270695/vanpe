<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\RstArea;
use App\Models\Tenant\RstTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.tables.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tableId = $this->route('table')?->id;
        $areaId = $this->input('area_id') ?? $this->route('table')?->area_id;

        return [
            'area_id' => ['required', 'uuid', Rule::exists(RstArea::class, 'id')],
            'number' => [
                'required',
                'string',
                'max:20',
                Rule::unique(RstTable::class, 'number')
                    ->where('area_id', $areaId)
                    ->ignore($tableId),
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:99'],
            'capacity_max' => ['nullable', 'integer', 'min:1', 'max:99', 'gte:capacity'],
            'status' => ['nullable', Rule::in(RstTable::STATUSES)],
            'shape' => ['nullable', Rule::in(RstTable::SHAPES)],
            'reservable' => ['boolean'],
            'active' => ['boolean'],
        ];
    }
}
