<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/**
 * Completa el SSO Google en el subdominio del restaurante.
 * El code se emite en el callback central (GoogleController).
 */
class GoogleHandoffController extends Controller
{
    public function __invoke(Request $request, TenantManager $manager): RedirectResponse
    {
        $code = (string) $request->query('code', '');
        abort_if($code === '', 404);

        $cacheKey = 'google_tenant_handoff:'.$code;
        $payload = Cache::get($cacheKey);
        abort_if(! is_array($payload), 410, 'El enlace de Google expiró. Intenta de nuevo.');

        $tenant = Tenant::query()->find($payload['tenant_id'] ?? null);
        abort_if($tenant === null, 404);

        if (! $manager->check() || $manager->tenant()?->id !== $tenant->id) {
            return redirect()->away(
                $tenant->subdomainUrl('/auth/google/handoff?'.$request->getQueryString())
            );
        }

        $user = TenantUser::query()->find((int) ($payload['user_id'] ?? 0));
        abort_if($user === null || ! $user->activo, 403);

        if ($user->es_owner && $user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Cache::forget($cacheKey);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->to('/dashboard');
    }
}
