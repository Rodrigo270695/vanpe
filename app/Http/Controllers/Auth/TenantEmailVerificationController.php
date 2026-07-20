<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Services\Tenant\TenantProvisioner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Confirma el correo del dueño de un restaurante (usuario en el schema del tenant).
 *
 * El enlace es firmado (temporarySignedRoute) e incluye el hash del correo para
 * evitar manipulaciones. Al confirmar, marca email_verified_at en el schema del tenant.
 */
class TenantEmailVerificationController extends Controller
{
    public function __invoke(Request $request, TenantProvisioner $provisioner, string $tenant, int $user, string $hash): RedirectResponse
    {
        $tenantModel = Tenant::query()->find($tenant);

        if ($tenantModel === null) {
            return redirect()->route('login')->with('status', 'El enlace de confirmación no es válido.');
        }

        $provisioner->bindSchema($tenantModel);

        $owner = TenantUser::query()->find($user);

        if ($owner === null || ! hash_equals(sha1((string) $owner->email), $hash)) {
            return redirect()->route('login')->with('status', 'El enlace de confirmación no es válido.');
        }

        if ($owner->email_verified_at !== null) {
            return redirect()->route('login')->with(
                'status',
                "Tu correo ya estaba confirmado. Accede a tu panel en {$tenantModel->subdomainHost()}.",
            );
        }

        $owner->forceFill(['email_verified_at' => now()])->save();

        return redirect()->route('login')->with(
            'status',
            "¡Correo confirmado! Ya puedes ingresar a {$tenantModel->nombre_comercial} en {$tenantModel->subdomainHost()}.",
        );
    }
}
