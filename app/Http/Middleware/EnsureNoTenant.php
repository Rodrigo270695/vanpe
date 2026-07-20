<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rutas exclusivas del dominio central (registro de restaurantes, panel de
 * plataforma). Aborta 404 si se accede desde el subdominio de un tenant.
 */
class EnsureNoTenant
{
    public function __construct(private readonly TenantManager $manager) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->manager->check()) {
            abort(404);
        }

        return $next($request);
    }
}
