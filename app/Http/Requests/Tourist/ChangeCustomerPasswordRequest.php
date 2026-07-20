<?php

namespace App\Http\Requests\Tourist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangeCustomerPasswordRequest extends FormRequest
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
        /** @var \App\Models\Customer $customer */
        $customer = $this->user();

        $rules = [
            'password' => ['required', 'confirmed', Password::defaults()],
        ];

        if ($customer->hasPassword()) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        return $rules;
    }
}
