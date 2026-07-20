<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreTenantRequest;
use App\Http\Requests\Platform\UpdateTenantRequest;
use App\Models\Tenant;
use App\Services\Platform\PublicCatalogPublisher;
use App\Services\Tenant\TenantProvisioner;
use App\Support\TenantSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Restaurantes registrados (tenants) — solo plataforma / superadmin. */
class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenants.view'), 403);

        $tenants = Tenant::query()
            ->with(['subscription.plan:id,name,code'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Tenant $tenant): array => $this->serialize($tenant));

        return Inertia::render('tenants/index', [
            'tenants' => $tenants,
            'statuses' => Tenant::STATUSES,
            'can' => [
                'create' => $request->user()?->can('tenants.create'),
                'update' => $request->user()?->can('tenants.update'),
                'delete' => $request->user()?->can('tenants.delete'),
            ],
        ]);
    }

    public function store(
        StoreTenantRequest $request,
        TenantProvisioner $provisioner,
    ): RedirectResponse {
        $data = $request->validated();
        $slug = $data['slug'] ?? TenantSlug::unique($data['nombre_comercial']);

        $tenant = $provisioner->provision([
            'slug' => $slug,
            'razon_social' => $data['razon_social'] ?: $data['nombre_comercial'],
            'nombre_comercial' => $data['nombre_comercial'],
            'ruc' => $data['ruc'] ?? null,
            'email_admin' => $data['email_admin'],
            'telefono' => $data['telefono'] ?? null,
            'actor_type' => 'admin',
            'actor_id' => $request->user()?->id,
            'owner' => [
                'name' => $data['owner_name'],
                'email' => $data['email_admin'],
                'password' => $data['owner_password'],
                'email_verified_at' => now(),
            ],
        ]);

        if (! empty($data['canal_adquisicion'])) {
            $tenant->update(['canal_adquisicion' => $data['canal_adquisicion']]);
        }

        return back()->with('success', __('messages.tenants.created'));
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant, PublicCatalogPublisher $publisher): RedirectResponse
    {
        $data = $request->validated();
        $previousStatus = $tenant->estado;

        $tenant->fill([
            'nombre_comercial' => $data['nombre_comercial'],
            'razon_social' => $data['razon_social'],
            'ruc' => $data['ruc'] ?? null,
            'email_admin' => $data['email_admin'],
            'telefono' => $data['telefono'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'estado' => $data['estado'],
            'publicado' => $data['publicado'] ?? false,
            'onboarding_completado' => $data['onboarding_completado'] ?? false,
            'onboarding_paso' => $data['onboarding_paso'] ?? 0,
            'canal_adquisicion' => $data['canal_adquisicion'] ?? null,
        ]);

        if ($data['estado'] === 'suspended' && $previousStatus !== 'suspended') {
            $tenant->suspended_at = now();
            $tenant->suspension_reason = $data['suspension_reason'] ?? null;
        }

        if ($data['estado'] !== 'suspended') {
            $tenant->suspended_at = null;
            $tenant->suspension_reason = null;
        }

        if ($data['estado'] === 'cancelled' && $previousStatus !== 'cancelled') {
            $tenant->cancelled_at = now();
            $tenant->publicado = false;
        }

        if ($data['estado'] !== 'cancelled' && $previousStatus === 'cancelled') {
            $tenant->cancelled_at = null;
        }

        $tenant->save();

        $publisher->publishNow($tenant->fresh(), ['ficha']);

        return back()->with('success', __('messages.tenants.updated'));
    }

    public function destroy(Request $request, Tenant $tenant): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenants.delete'), 403);

        $tenant->delete();

        return back()->with('success', __('messages.tenants.deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'slug' => $tenant->slug,
            'schema_name' => $tenant->schema_name,
            'subdomain_host' => $tenant->subdomainHost(),
            'subdomain_url' => $tenant->subdomainUrl(),
            'razon_social' => $tenant->razon_social,
            'nombre_comercial' => $tenant->nombre_comercial,
            'ruc' => $tenant->ruc,
            'email_admin' => $tenant->email_admin,
            'telefono' => $tenant->telefono,
            'direccion' => $tenant->direccion,
            'estado' => $tenant->estado,
            'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            'suspended_at' => $tenant->suspended_at?->toIso8601String(),
            'suspension_reason' => $tenant->suspension_reason,
            'cancelled_at' => $tenant->cancelled_at?->toIso8601String(),
            'onboarding_completado' => $tenant->onboarding_completado,
            'onboarding_paso' => $tenant->onboarding_paso,
            'publicado' => $tenant->publicado,
            'canal_adquisicion' => $tenant->canal_adquisicion,
            'plan_id' => $tenant->subscription?->plan_id,
            'plan_name' => $tenant->subscription?->plan?->name,
            'plan_code' => $tenant->subscription?->plan?->code,
            'subscription_status' => $tenant->subscription?->status,
            'created_at' => $tenant->created_at?->toIso8601String(),
        ];
    }
}
