<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\Tenant\User as TenantUser;
use App\Models\User;
use App\Tenancy\TenantManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
        $this->configureHybridLogin();
    }

    /**
     * Login híbrido según el host:
     *   - Dominio central   → administradores de plataforma por USUARIO o correo
     *                          (public.users).
     *   - Subdominio tenant → personal del restaurante por USUARIO o correo
     *                          (rst_*.users). El dueño debe tener el correo confirmado.
     */
    private function configureHybridLogin(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $identifier = (string) $request->input(Fortify::username());
            $password = (string) $request->input('password');

            $manager = app(TenantManager::class);

            if ($manager->check()) {
                return $this->authenticateTenantUser($identifier, $password);
            }

            return $this->authenticateCentralUser($identifier, $password);
        });
    }

    private function authenticateCentralUser(string $identifier, string $password): ?User
    {
        $user = User::query()
            ->where(function ($query) use ($identifier): void {
                $query->where('username', $identifier)
                    ->orWhere('email', $identifier);
            })
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        $this->assertActive($user->activo);

        return $user;
    }

    private function authenticateTenantUser(string $identifier, string $password): ?TenantUser
    {
        $user = TenantUser::query()
            ->where(function ($query) use ($identifier): void {
                $query->where('username', $identifier)
                    ->orWhere('email', $identifier);
            })
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        $this->assertActive($user->activo);

        // El dueño debe confirmar su correo antes de acceder.
        if ($user->es_owner && $user->email_verified_at === null) {
            throw ValidationException::withMessages([
                Fortify::username() => __('messages.auth.email_unverified'),
            ]);
        }

        return $user;
    }

    /**
     * Impide el acceso a usuarios desactivados con un mensaje claro.
     */
    private function assertActive(bool $activo): void
    {
        if (! $activo) {
            throw ValidationException::withMessages([
                Fortify::username() => __('messages.auth.account_inactive'),
            ]);
        }
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'rootDomain' => (string) config('tenant.root_domain'),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn (Request $request) => Inertia::render('auth/confirm-password', [
            'canConfirmWithPasskey' => Features::canManagePasskeys()
                && $request->user() instanceof PasskeyUser,
        ]));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(10)->by(
                ($request->input('credential.id') ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
    }
}
