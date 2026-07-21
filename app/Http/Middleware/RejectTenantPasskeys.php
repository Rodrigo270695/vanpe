<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectTenantPasskeys
{
    public function __construct(
        private readonly TenantManager $tenantManager,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (
            $this->tenantManager->check()
            && ($request->is('passkeys/*') || $request->is('user/passkeys*'))
        ) {
            abort(404);
        }

        return $next($request);
    }
}
