<?php

namespace App\Tenancy\Resolvers;

use Illuminate\Http\Request;

/**
 * Extrae el slug del tenant a partir del host de la petición.
 *
 *   elcantaro.localhost        → "elcantaro"
 *   elcantaro.vanpe.com.pe     → "elcantaro"
 *   localhost / 127.0.0.1      → null (dominio central)
 *   admin.elcantaro.vanpe...   → null (sub-subdominio no permitido)
 */
class SubdomainResolver
{
    public function resolveFromRequest(Request $request): ?string
    {
        return $this->resolveFromHost($request->getHost());
    }

    public function resolveFromHost(string $host): ?string
    {
        $host = strtolower(trim($host));

        if ($host === '') {
            return null;
        }

        $centrals = array_map('strtolower', (array) config('tenant.central_domains', []));
        if (in_array($host, $centrals, true)) {
            return null;
        }

        $root = strtolower((string) config('tenant.root_domain', ''));
        if ($root === '') {
            return null;
        }

        $suffix = '.'.$root;
        if (! str_ends_with($host, $suffix)) {
            return null;
        }

        $sub = substr($host, 0, -strlen($suffix));

        // No permitimos sub-subdominios (ej: admin.elcantaro.vanpe.com.pe).
        if ($sub === '' || str_contains($sub, '.')) {
            return null;
        }

        // Debe ser un subdominio DNS válido.
        if (! preg_match('/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/', $sub)) {
            return null;
        }

        return $sub;
    }
}
