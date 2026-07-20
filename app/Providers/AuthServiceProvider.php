<?php

namespace App\Providers;

use App\Auth\TenantAwareUserProvider;
use App\Models\Tenant\User as TenantUser;
use App\Models\User;
use App\Tenancy\TenantManager;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantManager::class);
    }

    public function boot(): void
    {
        Auth::provider('tenant-aware', function ($app, array $config): TenantAwareUserProvider {
            $hasher = $app['hash'];

            return new TenantAwareUserProvider(
                $app->make(TenantManager::class),
                new EloquentUserProvider($hasher, User::class),
                new EloquentUserProvider($hasher, TenantUser::class),
            );
        });

        // El superadministrador siempre pasa cualquier verificación de permiso.
        Gate::before(function ($user, string $ability): ?bool {
            return method_exists($user, 'hasRole') && $user->hasRole('superadmin')
                ? true
                : null;
        });
    }
}
