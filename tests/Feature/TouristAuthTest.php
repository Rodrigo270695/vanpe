<?php

use App\Models\Customer;
use App\Notifications\Tourist\ResetCustomerPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    config()->set('tourist.google_client_ids', ['test-android-client.apps.googleusercontent.com']);
});

test('turista puede registrarse y recibe token', function () {
    $response = $this->postJson('/api/v1/tourist/register', [
        'name' => 'Ana Turista',
        'email' => 'ana@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'phone' => '999111222',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.customer.email', 'ana@example.com')
        ->assertJsonStructure(['data' => ['token', 'token_type', 'customer' => ['id', 'name', 'email']]]);

    $this->assertDatabaseHas('customers', [
        'email' => 'ana@example.com',
        'status' => Customer::STATUS_ACTIVE,
    ]);
});

test('login con credenciales inválidas falla', function () {
    Customer::factory()->create([
        'email' => 'ana@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/v1/tourist/login', [
        'email' => 'ana@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('login exitoso emite token con ability tourist-app', function () {
    $customer = Customer::factory()->create([
        'email' => 'ana@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/tourist/login', [
        'email' => 'ana@example.com',
        'password' => 'password123',
        'device_name' => 'pixel-test',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.customer.id', $customer->id);

    expect($customer->fresh()->tokens)->toHaveCount(1);
    expect($customer->fresh()->tokens->first()->can('tourist-app'))->toBeTrue();
    expect($customer->fresh()->last_login_at)->not->toBeNull();
});

test('cuenta bloqueada no puede iniciar sesión', function () {
    Customer::factory()->blocked()->create([
        'email' => 'blocked@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/v1/tourist/login', [
        'email' => 'blocked@example.com',
        'password' => 'password123',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('google crea cuenta nueva sin contraseña falsa', function () {
    Http::fake([
        'oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-sub-001',
            'aud' => 'test-android-client.apps.googleusercontent.com',
            'email' => 'google.user@example.com',
            'email_verified' => 'true',
            'name' => 'Google User',
            'picture' => 'https://example.com/a.png',
            'exp' => now()->addHour()->timestamp,
        ]),
    ]);

    $response = $this->postJson('/api/v1/tourist/google', [
        'id_token' => 'fake-google-id-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.customer.email', 'google.user@example.com')
        ->assertJsonPath('data.customer.has_password', false)
        ->assertJsonPath('data.customer.has_google', true);

    $this->assertDatabaseHas('customers', [
        'email' => 'google.user@example.com',
        'google_id' => 'google-sub-001',
        'password' => null,
    ]);
});

test('google vincula cuenta existente por email verificado', function () {
    $customer = Customer::factory()->create([
        'email' => 'link@example.com',
        'password' => 'password123',
        'google_id' => null,
    ]);

    Http::fake([
        'oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-sub-link',
            'aud' => 'test-android-client.apps.googleusercontent.com',
            'email' => 'link@example.com',
            'email_verified' => true,
            'name' => 'Link User',
            'exp' => now()->addHour()->timestamp,
        ]),
    ]);

    $this->postJson('/api/v1/tourist/google', [
        'id_token' => 'fake-token',
    ])->assertOk();

    expect($customer->fresh()->google_id)->toBe('google-sub-link');
    expect($customer->fresh()->hasPassword())->toBeTrue();
});

test('me y logout requieren token válido', function () {
    $customer = Customer::factory()->create();
    $token = $customer->createToken('tourist-app', ['tourist-app'])->plainTextToken;

    $this->getJson('/api/v1/tourist/me', [
        'Authorization' => "Bearer {$token}",
    ])->assertOk()
        ->assertJsonPath('data.email', $customer->email);

    $this->postJson('/api/v1/tourist/logout', [], [
        'Authorization' => "Bearer {$token}",
    ])->assertOk();

    expect($customer->fresh()->tokens)->toHaveCount(0);
});

test('token sin ability tourist-app es rechazado', function () {
    $customer = Customer::factory()->create();
    $token = $customer->createToken('other', ['other-ability'])->plainTextToken;

    $this->getJson('/api/v1/tourist/me', [
        'Authorization' => "Bearer {$token}",
    ])->assertForbidden();
});

test('turista puede actualizar perfil', function () {
    $customer = Customer::factory()->create();
    Sanctum::actingAs($customer, ['tourist-app']);

    $this->patchJson('/api/v1/tourist/profile', [
        'name' => 'Nombre Nuevo',
        'phone' => '911223344',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Nombre Nuevo')
        ->assertJsonPath('data.phone', '911223344');
});

test('turista puede cambiar contraseña', function () {
    $customer = Customer::factory()->create([
        'password' => 'password123',
    ]);
    Sanctum::actingAs($customer, ['tourist-app']);

    $this->putJson('/api/v1/tourist/password', [
        'current_password' => 'password123',
        'password' => 'nuevaClave99',
        'password_confirmation' => 'nuevaClave99',
    ])->assertOk();

    expect(Hash::check('nuevaClave99', $customer->fresh()->password))->toBeTrue();
});

test('forgot password envía notificación', function () {
    Notification::fake();

    $customer = Customer::factory()->create([
        'email' => 'reset@example.com',
    ]);

    $this->postJson('/api/v1/tourist/forgot-password', [
        'email' => 'reset@example.com',
    ])->assertOk();

    Notification::assertSentTo($customer, ResetCustomerPasswordNotification::class);
});

test('reset password con token válido', function () {
    $customer = Customer::factory()->create([
        'email' => 'reset2@example.com',
        'password' => 'password123',
    ]);

    $token = Password::broker('customers')->createToken($customer);

    $this->postJson('/api/v1/tourist/reset-password', [
        'email' => 'reset2@example.com',
        'token' => $token,
        'password' => 'otraClave88',
        'password_confirmation' => 'otraClave88',
    ])->assertOk();

    expect(Hash::check('otraClave88', $customer->fresh()->password))->toBeTrue();
});

test('eliminar cuenta requiere confirmación y revoca tokens', function () {
    $customer = Customer::factory()->create();
    Sanctum::actingAs($customer, ['tourist-app']);

    $this->deleteJson('/api/v1/tourist/account', [
        'confirmation' => 'ELIMINAR',
    ])->assertOk();

    expect(Customer::query()->find($customer->id))->toBeNull();
    expect(Customer::withTrashed()->find($customer->id))->not->toBeNull();
});
