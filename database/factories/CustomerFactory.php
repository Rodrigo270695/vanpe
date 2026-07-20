<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->numerify('9########'),
            'avatar_url' => null,
            'password' => static::$password ??= Hash::make('password'),
            'google_id' => null,
            'status' => Customer::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'last_login_at' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function blocked(): static
    {
        return $this->state(fn (): array => [
            'status' => Customer::STATUS_BLOCKED,
        ]);
    }

    public function googleOnly(): static
    {
        return $this->state(fn (): array => [
            'password' => null,
            'google_id' => 'google-'.fake()->unique()->numerify('########'),
            'email_verified_at' => now(),
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (): array => [
            'email_verified_at' => null,
        ]);
    }
}
