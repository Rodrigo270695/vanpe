<?php

namespace App\Http\Middleware;

use App\Tenancy\Resolvers\SubdomainResolver;
use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resuelve el subdominio de la petición y, si corresponde a un tenant, fija el
 * search_path de la conexión `tenant`. Se ejecuta antes de la autenticación.
 */
class ResolveTenant
{
    public function __construct(
        private readonly TenantManager $manager,
        private readonly SubdomainResolver $resolver,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Evita que un search_path residual afecte la resolución.
        $this->manager->forget();
        $this->configurePasswordBroker('users');

        $slug = $this->resolver->resolveFromRequest($request);

        if ($slug === null) {
            return $next($request);
        }

        // Lanza TenantNotFound / TenantUnavailable si no procede (ver bootstrap/app.php).
        $context = $this->manager->resolveBySlug($slug);
        $this->configurePasswordBroker('tenant_users');

        // Aísla la caché de permisos de Spatie por schema, para que los permisos
        // de un restaurante nunca se mezclen con los de otro ni con la plataforma.
        app(PermissionRegistrar::class)->cacheKey =
            config('permission.cache.key').'.'.$context->schema;

        // Permite generar rutas de tenant sin pasar el subdominio manualmente.
        URL::defaults(['tenant_subdomain' => $slug]);

        return $next($request);
    }

    private function configurePasswordBroker(string $broker): void
    {
        config(['fortify.passwords' => $broker]);
    }
}
