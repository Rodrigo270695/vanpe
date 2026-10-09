<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe rutas del subdominio a ciertos tipos de negocio.
 * Uso: `tenant.type:restaurant` o `tenant.type:restaurant,hotel`.
 * Un negocio de otro tipo vuelve a su panel en vez de ver módulos ajenos.
 */
class EnsureTenantType
{
    public function __construct(private readonly TenantManager $manager) {}

    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $tenant = $this->manager->tenant();
        $tipo = $tenant?->tipo ?: Tenant::TYPE_RESTAURANT;

        if ($tenant !== null && ! in_array($tipo, $types, true)) {
            if ($request->isMethod('GET') && ! $request->expectsJson()) {
                return redirect()->route('dashboard');
            }

            abort(404);
        }

        return $next($request);
    }
}
