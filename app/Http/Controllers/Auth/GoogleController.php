<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleController extends Controller
{
    /**
     * Redirige al consentimiento de Google.
     * Query: popup=1, intent=tenant_login, tenant={slug}, opener_origin=...
     */
    public function redirect(Request $request): RedirectResponse
    {
        $request->session()->put('google_popup', $request->boolean('popup'));
        $request->session()->put('google_opener_origin', $request->string('opener_origin')->toString() ?: null);

        $intent = $request->string('intent')->toString();
        $tenantSlug = $request->string('tenant')->toString();

        if ($intent === 'tenant_login' && $tenantSlug !== '') {
            $request->session()->put('google_intent', 'tenant_login');
            $request->session()->put('google_tenant_slug', $tenantSlug);
        } else {
            $request->session()->forget(['google_intent', 'google_tenant_slug']);
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse|Response
    {
        $popup = (bool) $request->session()->pull('google_popup', false);
        $openerOrigin = $request->session()->pull('google_opener_origin');
        $intent = (string) $request->session()->pull('google_intent', '');
        $tenantSlug = (string) $request->session()->pull('google_tenant_slug', '');

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            if ($popup) {
                return $this->popupResponse([
                    'status' => 'error',
                    'message' => __('messages.auth.google_failed'),
                    'openerOrigin' => $openerOrigin,
                ]);
            }

            return redirect()->route('login')->withErrors([
                'email' => __('messages.auth.google_failed'),
            ]);
        }

        $email = (string) $googleUser->getEmail();
        $googleId = (string) $googleUser->getId();

        // Login Google desde el panel del restaurante.
        if ($intent === 'tenant_login' && $tenantSlug !== '') {
            return $this->finishTenantLogin(
                $request,
                $popup,
                $openerOrigin,
                $tenantSlug,
                $email,
                $googleId,
            );
        }

        // 1) Usuario de plataforma.
        $platform = User::query()->where('email', $email)->first();
        if ($platform !== null) {
            Auth::login($platform, remember: true);
            $request->session()->regenerate();

            return $this->finish($popup, route('dashboard', absolute: false), $openerOrigin);
        }

        // 2) Dueño ya registrado → mandarlo a su subdominio (login con Google allí).
        $tenant = Tenant::query()->where('email_admin', $email)->first();
        if ($tenant !== null) {
            $this->ensureOwnerGoogleId($tenant, $email, $googleId);

            return $this->finish(
                $popup,
                $tenant->subdomainUrl('/login'),
                $openerOrigin,
                __('messages.auth.google_owner_exists', ['host' => $tenant->subdomainHost()]),
            );
        }

        // 3) Nuevo → onboarding.
        $request->session()->put('pending_owner', [
            'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Usuario',
            'email' => $email,
            'google_id' => $googleId,
            'avatar' => $googleUser->getAvatar(),
        ]);

        return $this->finish($popup, route('owner.onboarding', absolute: false), $openerOrigin);
    }

    private function finishTenantLogin(
        Request $request,
        bool $popup,
        mixed $openerOrigin,
        string $tenantSlug,
        string $email,
        string $googleId,
    ): RedirectResponse|Response {
        $tenant = Tenant::query()->where('slug', $tenantSlug)->first();
        if ($tenant === null) {
            return $this->finish($popup, route('login', absolute: false), $openerOrigin, __('messages.auth.google_failed'));
        }

        $user = $this->findOrLinkTenantUser($tenant, $email, $googleId);
        if ($user === null) {
            return $this->finish(
                $popup,
                $tenant->subdomainUrl('/login'),
                $openerOrigin,
                __('messages.auth.google_tenant_user_missing'),
            );
        }

        $code = Str::random(48);
        Cache::put('google_tenant_handoff:'.$code, [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ], now()->addMinutes(5));

        return $this->finish(
            $popup,
            $tenant->subdomainUrl('/auth/google/handoff?code='.$code),
            $openerOrigin,
        );
    }

    private function findOrLinkTenantUser(Tenant $tenant, string $email, string $googleId): ?TenantUser
    {
        $previous = Config::get('database.connections.tenant.search_path');
        Config::set('database.connections.tenant.search_path', $tenant->schema_name);
        DB::purge('tenant');

        try {
            $user = TenantUser::query()
                ->where(function ($q) use ($email, $googleId): void {
                    $q->where('email', $email)
                        ->orWhere('google_id', $googleId);
                })
                ->first();

            if ($user === null) {
                return null;
            }

            if ($user->google_id !== $googleId) {
                $user->forceFill(['google_id' => $googleId])->save();
            }

            if ($user->es_owner && $user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            return $user;
        } finally {
            Config::set('database.connections.tenant.search_path', $previous ?: 'public');
            DB::purge('tenant');
        }
    }

    private function ensureOwnerGoogleId(Tenant $tenant, string $email, string $googleId): void
    {
        $this->findOrLinkTenantUser($tenant, $email, $googleId);
    }

    /**
     * @param  mixed  $openerOrigin
     */
    private function finish(
        bool $popup,
        string $redirect,
        mixed $openerOrigin = null,
        ?string $statusMessage = null,
    ): RedirectResponse|Response {
        if ($statusMessage !== null && ! $popup) {
            // Absolute redirects can't carry session flash across hosts.
            if (str_starts_with($redirect, 'http')) {
                $sep = str_contains($redirect, '?') ? '&' : '?';
                $redirect .= $sep.'status='.urlencode($statusMessage);
            } else {
                session()->flash('status', $statusMessage);
            }
        }

        if ($popup) {
            return $this->popupResponse([
                'status' => 'success',
                'redirect' => $redirect,
                'message' => $statusMessage,
                'openerOrigin' => is_string($openerOrigin) && $openerOrigin !== ''
                    ? $openerOrigin
                    : null,
            ]);
        }

        if (str_starts_with($redirect, 'http')) {
            return redirect()->away($redirect);
        }

        return redirect()->to($redirect);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function popupResponse(array $payload): Response
    {
        return response()->view('auth.google-callback', ['payload' => $payload]);
    }
}
