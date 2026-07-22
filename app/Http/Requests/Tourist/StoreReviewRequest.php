<?php

namespace App\Http\Requests\Tourist;

use App\Models\CustomerReview;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReviewRequest extends FormRequest
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
            'target_type' => ['required', Rule::in([
                CustomerReview::TARGET_RESTAURANT,
                CustomerReview::TARGET_TOUR_SPOT,
            ])],
            'target_id' => ['required', 'uuid'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'titulo' => ['nullable', 'string', 'max:120'],
            'comentario' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
