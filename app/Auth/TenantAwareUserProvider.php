<?php

namespace App\Auth;

use App\Tenancy\TenantManager;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;

/**
 * Provider de usuarios que decide contra qué tabla autenticar según el host:
 *   - Subdominio de tenant  → usuarios del schema del restaurante (rst_*.users).
 *   - Dominio central        → usuarios de plataforma (public.users).
 *
 * Como `SESSION_DOMAIN=null` las cookies son por host, la sesión de un
 * subdominio nunca se mezcla con la del dominio central ni con otro tenant.
 */
class TenantAwareUserProvider implements UserProvider
{
    public function __construct(
        private readonly TenantManager $manager,
        private readonly EloquentUserProvider $central,
        private readonly EloquentUserProvider $tenant,
    ) {}

    private function provider(): EloquentUserProvider
    {
        return $this->manager->check() ? $this->tenant : $this->central;
    }

    public function retrieveById($identifier)
    {
        return $this->provider()->retrieveById($identifier);
    }

    public function retrieveByToken($identifier, #[\SensitiveParameter] $token)
    {
        return $this->provider()->retrieveByToken($identifier, $token);
    }

    public function updateRememberToken(Authenticatable $user, #[\SensitiveParameter] $token)
    {
        $this->provider()->updateRememberToken($user, $token);
    }

    public function retrieveByCredentials(#[\SensitiveParameter] array $credentials)
    {
        return $this->provider()->retrieveByCredentials($credentials);
    }

    public function validateCredentials(Authenticatable $user, #[\SensitiveParameter] array $credentials)
    {
        return $this->provider()->validateCredentials($user, $credentials);
    }

    public function rehashPasswordIfRequired(Authenticatable $user, #[\SensitiveParameter] array $credentials, bool $force = false)
    {
        $this->provider()->rehashPasswordIfRequired($user, $credentials, $force);
    }
}
