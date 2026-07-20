<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleController extends Controller
{
    /**
     * Redirige al usuario a la pantalla de consentimiento de Google.
     * Si `popup=1`, recuerda que el flujo se abrió en una ventana emergente
     * para responder cerrándola en lugar de navegar la página principal.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $request->session()->put('google_popup', $request->boolean('popup'));

        return Socialite::driver('google')->redirect();
    }

    /**
     * Callback de Google. Google solo aporta la identidad (correo verificado):
     *   1) Si el correo YA es un usuario de plataforma → inicia sesión (panel).
     *   2) Si el correo YA es dueño de un restaurante → que entre por su subdominio.
     *   3) Si es nuevo → guarda el perfil y pasa al onboarding del restaurante.
     */
    public function callback(Request $request): RedirectResponse|Response
    {
        $popup = (bool) $request->session()->pull('google_popup', false);

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            if ($popup) {
                return $this->popupResponse([
                    'status' => 'error',
                    'message' => __('messages.auth.google_failed'),
                ]);
            }

            return redirect()->route('login')->withErrors([
                'email' => __('messages.auth.google_failed'),
            ]);
        }

        $email = (string) $googleUser->getEmail();

        // 1) Usuario de plataforma existente (superadmin / staff) → login normal.
        $platform = User::query()->where('email', $email)->first();
        if ($platform !== null) {
            Auth::login($platform, remember: true);
            $request->session()->regenerate();

            return $this->finish($request, $popup, route('dashboard', absolute: false));
        }

        // 2) El correo ya registró un restaurante → debe entrar por su subdominio.
        $tenant = Tenant::query()->where('email_admin', $email)->first();
        if ($tenant !== null) {
            $request->session()->flash('status', __('messages.auth.google_owner_exists', [
                'host' => $tenant->subdomainHost(),
            ]));

            return $this->finish($request, $popup, route('login', absolute: false));
        }

        // 3) Nuevo → recordamos el perfil de Google y vamos al onboarding.
        $request->session()->put('pending_owner', [
            'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Usuario',
            'email' => $email,
            'google_id' => $googleUser->getId(),
            'avatar' => $googleUser->getAvatar(),
        ]);

        return $this->finish($request, $popup, route('owner.onboarding', absolute: false));
    }

    private function finish(Request $request, bool $popup, string $redirect): RedirectResponse|Response
    {
        if ($popup) {
            return $this->popupResponse([
                'status' => 'success',
                'redirect' => $redirect,
            ]);
        }

        return redirect()->to($redirect);
    }

    /**
     * Vista que notifica al opener (window.opener) y cierra la ventana emergente.
     *
     * @param  array<string, mixed>  $payload
     */
    private function popupResponse(array $payload): Response
    {
        return response()->view('auth.google-callback', ['payload' => $payload]);
    }
}
