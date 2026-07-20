<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TenantOwnerVerifyMail;
use App\Models\Tenant;
use App\Services\Tenant\TenantProvisioner;
use App\Support\TenantSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Registro de un DUEÑO de restaurante desde la web.
 *
 * Crea el tenant (schema aislado + roles + usuario owner) y envía un correo
 * de confirmación. El dueño luego accede a su subdominio.
 */
class TenantRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'passwordRules' => 'minlength: 8; required: lower; required: upper; required: digit;',
        ]);
    }

    public function store(Request $request, TenantProvisioner $provisioner): RedirectResponse
    {
        $validated = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:60'],
            'ruc' => ['nullable', 'regex:/^\d{11}$/', 'unique:tenants,ruc'],
            'email' => ['required', 'email', 'max:150', 'unique:tenants,email_admin'],
            'name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $slug = TenantSlug::unique($validated['slug'] ?: $validated['nombre_comercial']);

        $tenant = $provisioner->provision([
            'slug' => $slug,
            'razon_social' => $validated['nombre_comercial'],
            'nombre_comercial' => $validated['nombre_comercial'],
            'ruc' => $validated['ruc'] ?? null,
            'email_admin' => $validated['email'],
            'owner' => [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ],
        ]);

        $this->sendVerificationEmail($provisioner, $tenant);

        return redirect()->route('login')->with(
            'status',
            "¡{$tenant->nombre_comercial} registrado! Te enviamos un correo a {$validated['email']} para confirmar tu cuenta. Tu panel estará en {$tenant->subdomainHost()}.",
        );
    }

    private function sendVerificationEmail(TenantProvisioner $provisioner, Tenant $tenant): void
    {
        $owner = $provisioner->getOwner($tenant);

        if ($owner === null) {
            return;
        }

        $verifyUrl = URL::temporarySignedRoute(
            'tenant.verify',
            now()->addMinutes(60),
            [
                'tenant' => $tenant->id,
                'user' => $owner->id,
                'hash' => sha1((string) $owner->email),
            ],
        );

        Mail::to($owner->email)->send(new TenantOwnerVerifyMail(
            ownerName: $owner->name,
            restaurantName: $tenant->nombre_comercial,
            subdomain: $tenant->subdomainHost(),
            verifyUrl: $verifyUrl,
        ));
    }
}
