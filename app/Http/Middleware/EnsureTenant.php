<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rutas que solo tienen sentido dentro del subdominio de un tenant.
 * Aborta 404 si se accede desde el dominio central.
 */
class EnsureTenant
{
    public function __construct(private readonly TenantManager $manager) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->manager->check()) {
            abort(404);
        }

        return $next($request);
    }
}
