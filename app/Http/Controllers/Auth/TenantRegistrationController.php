<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendTenantOwnerVerification;
use App\Models\Tenant;
use App\Services\Tenant\TenantProvisioner;
use App\Support\TenantSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'rootDomain' => (string) config('tenant.root_domain'),
        ]);
    }

    public function store(Request $request, TenantProvisioner $provisioner): RedirectResponse
    {
        $validated = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:60', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'ruc' => ['nullable', 'regex:/^\d{11}$/', 'unique:tenants,ruc'],
            'email' => ['required', 'email', 'max:150', 'unique:tenants,email_admin'],
            'name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [
            'email.unique' => __('messages.auth.email_already_registered'),
            'ruc.unique' => __('messages.auth.ruc_already_registered'),
            'ruc.regex' => __('messages.auth.ruc_invalid'),
            'slug.regex' => __('messages.auth.slug_invalid'),
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

        $verificationQueued = $this->queueVerificationEmail($tenant);

        return redirect()->route('login')->with(
            'status',
            $verificationQueued
                ? __('messages.auth.registration_success', [
                    'name' => $tenant->nombre_comercial,
                    'email' => $validated['email'],
                    'host' => $tenant->subdomainHost(),
                ])
                : __('messages.auth.registration_mail_pending', [
                    'name' => $tenant->nombre_comercial,
                    'host' => $tenant->subdomainHost(),
                ]),
        );
    }

    public function createVerificationResend(): Response
    {
        return Inertia::render('auth/resend-verification');
    }

    public function resendVerification(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $tenant = Tenant::query()
            ->whereRaw('lower(email_admin) = ?', [mb_strtolower((string) $validated['email'])])
            ->first();

        if ($tenant !== null) {
            $this->queueVerificationEmail($tenant);
        }

        return back()->with('status', __('messages.auth.verification_resend_status'));
    }

    private function queueVerificationEmail(Tenant $tenant): bool
    {
        try {
            SendTenantOwnerVerification::dispatch((string) $tenant->id);

            return true;
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
