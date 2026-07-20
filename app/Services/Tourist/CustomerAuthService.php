<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use Illuminate\Validation\ValidationException;

class CustomerAuthService
{
    /**
     * @return array{token: string, token_type: string, customer: Customer}
     */
    public function issueToken(Customer $customer, ?string $deviceName = null): array
    {
        if ($customer->isBlocked()) {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está bloqueada. Contacta soporte VanPe.'],
            ]);
        }

        $customer->markLogin();

        $token = $customer->createToken(
            $deviceName ?: (string) config('tourist.token_name'),
            [(string) config('tourist.token_ability', Customer::TOKEN_ABILITY)],
        )->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'customer' => $customer->fresh() ?? $customer,
        ];
    }

    /**
     * Crea o vincula cuenta Google por correo verificado (sin contraseña falsa).
     *
     * @param  array{sub: string, email: string, name: string|null, picture: string|null, email_verified: bool}  $google
     */
    public function findOrCreateFromGoogle(array $google): Customer
    {
        $customer = Customer::query()
            ->where('google_id', $google['sub'])
            ->first();

        if ($customer !== null) {
            return $customer;
        }

        $customer = Customer::query()
            ->where('email', $google['email'])
            ->first();

        if ($customer !== null) {
            $customer->forceFill([
                'google_id' => $google['sub'],
                'avatar_url' => $customer->avatar_url ?: $google['picture'],
                'email_verified_at' => $customer->email_verified_at ?? now(),
            ])->save();

            return $customer->fresh() ?? $customer;
        }

        return Customer::query()->create([
            'name' => $google['name'] ?: strstr($google['email'], '@', true) ?: 'Turista VanPe',
            'email' => $google['email'],
            'password' => null,
            'google_id' => $google['sub'],
            'avatar_url' => $google['picture'],
            'status' => Customer::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
    }
}
