<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\TenantProvisioner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Activación de un miembro del personal por invitación (enlace firmado).
 *
 * El enlace vive en el dominio central; el controlador fija el schema del
 * restaurante por su id y opera sobre el usuario del tenant (rst_*).
 */
class StaffInvitationController extends Controller
{
    public function show(Request $request, TenantProvisioner $provisioner, string $tenant, string $user, string $hash): Response|RedirectResponse
    {
        [$tenantModel, $staff] = $this->resolve($provisioner, $tenant, $user, $hash);

        if ($tenantModel === null || $staff === null) {
            return redirect()->route('login')->with('status', 'El enlace de invitación no es válido o expiró.');
        }

        return Inertia::render('auth/accept-invitation', [
            'staffName' => $staff->name,
            'restaurantName' => $tenantModel->nombre_comercial,
            'loginUrl' => $tenantModel->subdomainUrl('/login'),
            'submitUrl' => $request->fullUrl(),
            'alreadyDone' => $staff->email_verified_at !== null,
            'passwordRules' => 'minlength: 8; required: lower; required: upper; required: digit;',
        ]);
    }

    public function store(Request $request, TenantProvisioner $provisioner, string $tenant, string $user, string $hash): SymfonyResponse
    {
        [$tenantModel, $staff] = $this->resolve($provisioner, $tenant, $user, $hash);

        if ($tenantModel === null || $staff === null) {
            return redirect()->route('login')->with('status', 'El enlace de invitación no es válido o expiró.');
        }

        if ($staff->email_verified_at !== null) {
            return Inertia::location($tenantModel->subdomainUrl('/login'));
        }

        $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $staff->forceFill([
            'password' => $request->string('password')->value(),
            'email_verified_at' => now(),
            'activo' => true,
        ])->save();

        return Inertia::location($tenantModel->subdomainUrl('/login'));
    }

    /**
     * Resuelve el restaurante y el usuario invitado, validando el hash del correo.
     *
     * @return array{0: Tenant|null, 1: TenantUser|null}
     */
    private function resolve(TenantProvisioner $provisioner, string $tenant, string $user, string $hash): array
    {
        $tenantModel = Tenant::query()->find($tenant);

        if ($tenantModel === null) {
            return [null, null];
        }

        $provisioner->bindSchema($tenantModel);

        $staff = TenantUser::query()->find($user);

        if ($staff === null || ! hash_equals(sha1((string) $staff->email), $hash)) {
            return [$tenantModel, null];
        }

        return [$tenantModel, $staff];
    }
}
