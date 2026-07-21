<?php

use App\Http\Middleware\EnsureNoTenant;
use App\Http\Middleware\EnsureTenant;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RejectTenantPasskeys;
use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\SetLocale;
use App\Tenancy\Exceptions\TenantNotFoundException;
use App\Tenancy\Exceptions\TenantUnavailableException;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'locale']);

        // Resuelve el subdominio del tenant ANTES de autenticar.
        // Debe posicionarse ANTES de la interfaz de autenticación en la lista
        // de prioridad (Laravel usa la interfaz, no la clase concreta), si no
        // el guard corre sin el schema del tenant fijado y falla la sesión.
        $middleware->web(prepend: [
            ResolveTenant::class,
        ]);
        $middleware->prependToPriorityList(
            before: AuthenticatesRequests::class,
            prepend: ResolveTenant::class,
        );

        $middleware->web(append: [
            HandleAppearance::class,
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RejectTenantPasskeys::class,
        ]);

        $middleware->alias([
            'tenant.required' => EnsureTenant::class,
            'tenant.none' => EnsureNoTenant::class,
            'abilities' => CheckAbilities::class,
            'ability' => CheckForAnyAbility::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->renderable(function (TenantNotFoundException $e) {
            abort(404, $e->getMessage());
        });

        $exceptions->renderable(function (TenantUnavailableException $e) {
            abort(403, $e->getMessage());
        });

        $exceptions->renderable(function (InvalidSignatureException $e, Request $request) {
            if ($request->is('email/verificar/*') || $request->is('invitacion/*')) {
                return redirect()->route('login')->with('status', __('messages.auth.link_expired'));
            }
        });
    })->create();
