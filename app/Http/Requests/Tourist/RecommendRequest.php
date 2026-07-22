<?php

namespace App\Http\Requests\Tourist;

use Illuminate\Foundation\Http\FormRequest;

class RecommendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:2', 'max:240'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:12'],
        ];
    }
}
