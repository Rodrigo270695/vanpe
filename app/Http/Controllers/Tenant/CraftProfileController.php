<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Platform\CraftController;
use App\Http\Requests\Tenant\CraftProfileRequest;
use App\Models\Craft;
use App\Models\Tenant;
use App\Services\Platform\CraftCatalogProvisioner;
use App\Services\Platform\CraftWriter;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Ficha "Mi artesanía" para tenants tipo artesanía (subdominio). */
class CraftProfileController extends Controller
{
    public function __construct(
        private readonly CraftWriter $writer,
        private readonly CraftCatalogProvisioner $provisioner,
    ) {}

    public function edit(Request $request): Response
    {
        $tenant = $this->currentTenant();

        abort_unless(
            (bool) $request->user()?->can('tenant.craft.manage')
            || (bool) $request->user()?->can('tenant.craft.publish'),
            403,
        );

        return Inertia::render('mi-artesania/index', [
            'craft' => $this->resolveCraft($tenant)->toAdminArray(),
            'options' => CraftController::formOptions(),
            'limits' => CraftController::formLimits(),
            'mapbox_token' => config('services.mapbox.token'),
            'can' => [
                'manage' => (bool) $request->user()?->can('tenant.craft.manage'),
                'publish' => (bool) $request->user()?->can('tenant.craft.publish'),
            ],
        ]);
    }

    public function update(CraftProfileRequest $request): RedirectResponse
    {
        $tenant = $this->currentTenant();
        $craft = $this->resolveCraft($tenant);

        $this->writer->update($craft, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.mi_artesania.saved'));
    }

    private function currentTenant(): Tenant
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null || ! $tenant->isCraft(), 404);

        return $tenant;
    }

    private function resolveCraft(Tenant $tenant): Craft
    {
        $craft = $tenant->craft ?? $this->provisioner->createStubForTenant($tenant);

        return $craft->fresh(['media']) ?? $craft;
    }
}
