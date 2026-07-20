<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\RstTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SeatWaitingListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.reservations.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'table_id' => ['required', 'uuid', Rule::exists(RstTable::class, 'id')],
        ];
    }
}
