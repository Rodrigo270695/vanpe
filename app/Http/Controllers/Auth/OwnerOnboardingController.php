<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Tenant\TenantProvisioner;
use App\Support\TenantSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Onboarding del dueño tras autenticar con Google.
 *
 * Google ya entregó la identidad (correo verificado); aquí completamos los
 * datos del restaurante y una contraseña (necesaria para el login del
 * subdominio) y provisionamos el tenant. No se envía correo de confirmación
 * porque el correo de Google ya viene verificado.
 */
class OwnerOnboardingController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        $pending = $request->session()->get('pending_owner');

        if (! is_array($pending)) {
            return redirect()->route('register');
        }

        return Inertia::render('auth/complete-registration', [
            'ownerName' => $pending['name'] ?? '',
            'ownerEmail' => $pending['email'] ?? '',
            'passwordRules' => 'minlength: 8; required: lower; required: upper; required: digit;',
        ]);
    }

    public function store(Request $request, TenantProvisioner $provisioner): RedirectResponse
    {
        $pending = $request->session()->get('pending_owner');

        if (! is_array($pending) || empty($pending['email'])) {
            return redirect()->route('register');
        }

        $email = (string) $pending['email'];

        $validated = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Si en el intermedio el correo ya quedó registrado, mándalo al login.
        if (Tenant::query()->where('email_admin', $email)->exists()) {
            $request->session()->forget('pending_owner');

            return redirect()->route('login')->with('status', __('messages.auth.google_owner_exists', [
                'host' => '',
            ]));
        }

        $slug = TenantSlug::unique($validated['slug'] ?: $validated['nombre_comercial']);

        $tenant = $provisioner->provision([
            'slug' => $slug,
            'razon_social' => $validated['nombre_comercial'],
            'nombre_comercial' => $validated['nombre_comercial'],
            'ruc' => null,
            'email_admin' => $email,
            'owner' => [
                'name' => $validated['name'],
                'email' => $email,
                'password' => $validated['password'],
                // Correo ya verificado por Google.
                'email_verified_at' => now(),
            ],
        ]);

        $request->session()->forget('pending_owner');

        return redirect()->route('login')->with(
            'status',
            __('messages.auth.onboarding_success', [
                'name' => $tenant->nombre_comercial,
                'host' => $tenant->subdomainHost(),
            ]),
        );
    }
}
