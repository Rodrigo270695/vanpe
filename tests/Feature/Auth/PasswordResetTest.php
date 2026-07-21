<?php

use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Models\User;
use App\Notifications\QueuedResetPassword;
use App\Notifications\QueuedTenantResetPassword;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Laravel\Fortify\Features;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::resetPasswords());
});

test('reset password link screen can be rendered', function () {
    $response = $this->get(route('password.request'));

    $response->assertOk();
});

test('reset password link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, QueuedResetPassword::class);
});

test('reset password screen can be rendered', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, QueuedResetPassword::class, function ($notification) {
        $response = $this->get(route('password.reset', $notification->token));

        $response->assertOk();

        return true;
    });
});

test('password can be reset with valid token', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, QueuedResetPassword::class, function ($notification) use ($user) {
        $response = $this->post(route('password.update'), [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'StrongPass10!',
            'password_confirmation' => 'StrongPass10!',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });
});

test('password cannot be reset with invalid token', function () {
    $user = User::factory()->create();

    $response = $this->post(route('password.update'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors('email');
});

test('restaurant owner can request reset link from central domain', function () {
    Notification::fake();

    config([
        'database.connections.tenant' => [
            ...config('database.connections.sqlite'),
            'database' => ':memory:',
        ],
    ]);
    DB::purge('tenant');

    Schema::connection('tenant')->create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('username')->unique();
        $table->string('email')->nullable()->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->boolean('activo')->default(true);
        $table->boolean('es_owner')->default(false);
        $table->rememberToken();
        $table->timestamps();
        $table->softDeletes();
    });
    Schema::connection('tenant')->create('password_reset_tokens', function (Blueprint $table) {
        $table->string('email')->primary();
        $table->string('token');
        $table->timestamp('created_at')->nullable();
    });

    $tenant = Tenant::query()->create([
        'slug' => 'restaurante-prueba',
        'schema_name' => 'rst_test',
        'razon_social' => 'Restaurante Prueba',
        'nombre_comercial' => 'Restaurante Prueba',
        'email_admin' => 'owner@example.com',
        'estado' => 'trial',
    ]);

    TenantUser::query()->create([
        'name' => 'Owner',
        'username' => 'owner',
        'email' => $tenant->email_admin,
        'password' => 'StrongPass10!',
        'activo' => true,
        'es_owner' => true,
    ]);

    $this->post(route('password.email'), ['email' => 'OWNER@example.com'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertSentOnDemand(
        QueuedTenantResetPassword::class,
        fn (QueuedTenantResetPassword $notification): bool => str_contains(
            $notification->resetUrl,
            'restaurante-prueba.vanpe.pe/reset-password/',
        ),
    );
});
