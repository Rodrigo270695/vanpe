<?php

namespace App\Http\Controllers\Auth;

use App\Models\Tenant;
use App\Models\User;
use App\Tenancy\TenantManager;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController as FortifyPasswordResetLinkController;
use Laravel\Fortify\Http\Requests\SendPasswordResetLinkRequest;

class PasswordResetLinkController extends FortifyPasswordResetLinkController
{
    public function __construct(
        private readonly TenantManager $tenantManager,
    ) {}

    public function store(SendPasswordResetLinkRequest $request): Responsable
    {
        $emailField = Fortify::email();
        $email = Str::lower((string) $request->input($emailField));
        $request->merge([$emailField => $email]);

        if ($this->tenantManager->check()) {
            return parent::store($request);
        }

        if (User::query()->whereRaw('lower(email) = ?', [$email])->exists()) {
            return parent::store($request);
        }

        $tenant = Tenant::query()
            ->whereRaw('lower(email_admin) = ?', [$email])
            ->first();

        if ($tenant === null) {
            return parent::store($request);
        }

        try {
            $this->tenantManager->resolveBySlug((string) $tenant->slug);

            $status = Password::broker('tenant_users')->sendResetLink([
                $emailField => $email,
            ]);
        } finally {
            $this->tenantManager->forget();
        }

        return $status === Password::RESET_LINK_SENT
            ? app(SuccessfulPasswordResetLinkRequestResponse::class, ['status' => $status])
            : app(FailedPasswordResetLinkRequestResponse::class, ['status' => $status]);
    }
}
