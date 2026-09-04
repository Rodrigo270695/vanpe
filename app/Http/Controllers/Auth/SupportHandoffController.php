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
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Completa el ingreso de soporte (superadmin) en el subdominio del tenant.
 * El code se emite desde TenantController::supportLogin (dominio central).
 */
class SupportHandoffController extends Controller
{
    public function __invoke(Request $request, TenantManager $manager): RedirectResponse
    {
        $code = (string) $request->query('code', '');
        abort_if($code === '', 404);

        $cacheKey = 'support_tenant_handoff:'.$code;
        $payload = Cache::get($cacheKey);
        abort_if(! is_array($payload), 410, 'El enlace de soporte expiró. Intenta de nuevo.');

        $tenant = Tenant::query()->find($payload['tenant_id'] ?? null);
        abort_if($tenant === null, 404);

        if (! $manager->check() || $manager->tenant()?->id !== $tenant->id) {
            return redirect()->away(
                $tenant->subdomainUrl('/auth/support/handoff?'.$request->getQueryString())
            );
        }

        $user = TenantUser::query()->find((int) ($payload['user_id'] ?? 0));
        abort_if($user === null || ! $user->activo, 403);

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Cache::forget($cacheKey);

        Auth::login($user, remember: false);
        $request->session()->regenerate();
        $request->session()->put('support_mode', true);
        $request->session()->put('support_actor_id', (int) ($payload['actor_id'] ?? 0));
        $request->session()->put('support_actor_name', (string) ($payload['actor_name'] ?? 'Soporte'));
        $request->session()->put('support_actor_email', (string) ($payload['actor_email'] ?? ''));
        $request->session()->put('support_return_url', (string) ($payload['return_url'] ?? config('app.url').'/restaurantes'));

        Log::info('support.handoff.completed', [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'owner_user_id' => $user->id,
            'actor_id' => $payload['actor_id'] ?? null,
            'actor_email' => $payload['actor_email'] ?? null,
        ]);

        return redirect()->to('/dashboard');
    }

    public function exit(Request $request): Response
    {
        abort_unless((bool) $request->session()->get('support_mode'), 403);

        $returnUrl = (string) $request->session()->get(
            'support_return_url',
            rtrim((string) config('app.url'), '/').'/restaurantes',
        );

        Log::info('support.session.exit', [
            'actor_id' => $request->session()->get('support_actor_id'),
            'actor_email' => $request->session()->get('support_actor_email'),
            'tenant_user_id' => $request->user()?->id,
        ]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Cross-domain: Inertia XHR no puede seguir away() (CORS).
        return Inertia::location($returnUrl);
    }
}