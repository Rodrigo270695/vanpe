<?php

namespace App\Http\Controllers;

use App\Services\Platform\PlatformDashboardService;
use App\Services\Tenant\TenantDashboardService;
use App\Tenancy\TenantManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        TenantManager $tenancy,
        TenantDashboardService $tenantDashboard,
        PlatformDashboardService $platformDashboard,
    ): Response {
        if ($tenancy->check()) {
            abort_unless($request->user(), 403);

            return Inertia::render('dashboard/tenant', $tenantDashboard->build());
        }

        abort_unless((bool) $request->user()?->can('dashboard.view'), 403);

        return Inertia::render('dashboard/platform', $platformDashboard->build());
    }
}
