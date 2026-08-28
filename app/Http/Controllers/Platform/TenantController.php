<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreTenantRequest;
use App\Http\Requests\Platform\UpdateTenantRequest;
use App\Models\Tenant;
use App\Models\Tenant\CfgVenuePhoto;
use App\Services\Platform\PublicCatalogPublisher;
use App\Services\Platform\PublicCatalogSync;
use App\Services\Tenant\TenantProvisioner;
use App\Services\Tenant\VenueImageStorage;
use App\Support\TenantSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Restaurantes registrados (tenants) — solo plataforma / superadmin. */
class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenants.view'), 403);

        $tenants = Tenant::query()
            ->with([
                'subscription.plan:id,name,code',
                'pubRestaurant:id,tenant_id',
                'tourSpot:id,tenant_id',
            ])
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
        VenueImageStorage $venueImages,
        PublicCatalogPublisher $publisher,
    ): RedirectResponse {
        $data = $request->validated();
        $slug = $data['slug'] ?? TenantSlug::unique($data['nombre_comercial']);

        $tenant = $provisioner->provision([
            'slug' => $slug,
            'tipo' => Tenant::TYPE_RESTAURANT,
            'razon_social' => $data['razon_social'] ?: $data['nombre_comercial'],
            'nombre_comercial' => $data['nombre_comercial'],
            'ruc' => $data['ruc'] ?? null,
            'email_admin' => $data['email_admin'],
            'telefono' => $data['telefono'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
            'actor_type' => 'admin',
            'actor_id' => $request->user()?->id,
            'owner' => [
                'name' => $data['owner_name'],
                'email' => $data['email_admin'],
                'password' => $data['owner_password'],
                'email_verified_at' => now(),
            ],
        ]);

        $updates = [];

        if (! empty($data['canal_adquisicion'])) {
            $updates['canal_adquisicion'] = $data['canal_adquisicion'];
        }

        if (! empty($data['descripcion'])) {
            $updates['descripcion'] = $data['descripcion'];
        }

        if ($request->hasFile('portada')) {
            $updates['portada_url'] = $venueImages->storeBranded(
                $request->file('portada'),
                (string) $tenant->slug,
                'portada',
            );
        }

        if ($updates !== []) {
            $tenant->update($updates);
        }

        $this->seedGalleryPhotos(
            $tenant->fresh(),
            $request->file('photos', []),
            $venueImages,
            $provisioner,
        );

        $publisher->publishNow($tenant->fresh(), ['ficha', 'galeria']);

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
            'descripcion' => $data['descripcion'] ?? null,
            'latitud' => $data['latitud'] ?? null,
            'longitud' => $data['longitud'] ?? null,
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

    public function destroy(
        Request $request,
        Tenant $tenant,
        PublicCatalogSync $catalogSync,
    ): RedirectResponse {
        abort_unless((bool) $request->user()?->can('tenants.delete'), 403);

        try {
            $catalogSync->deactivate($tenant);
        } catch (\Throwable) {
            // Si no hay ficha pública, seguimos con el soft-delete del tenant.
        }

        $tenant->delete();

        return back()->with('success', __('messages.tenants.deleted'));
    }

    /**
     * @param  list<UploadedFile>|UploadedFile|null  $files
     */
    private function seedGalleryPhotos(
        Tenant $tenant,
        array|UploadedFile|null $files,
        VenueImageStorage $venueImages,
        TenantProvisioner $provisioner,
    ): void {
        $uploads = is_array($files) ? $files : ($files ? [$files] : []);
        $uploads = array_values(array_filter(
            $uploads,
            fn ($file): bool => $file instanceof UploadedFile && $file->isValid(),
        ));

        if ($uploads === []) {
            return;
        }

        $uploads = array_slice($uploads, 0, CfgVenuePhoto::MAX_PHOTOS);

        $previous = DB::getDefaultConnection();
        $previousPath = config('database.connections.tenant.search_path');

        $provisioner->bindSchema($tenant);
        DB::setDefaultConnection('tenant');

        try {
            foreach ($uploads as $index => $file) {
                $photo = CfgVenuePhoto::query()->create([
                    'caption' => null,
                    'sort_order' => $index + 1,
                    'image_url' => '',
                ]);

                $imageUrl = $venueImages->storeGallery(
                    $file,
                    (string) $tenant->slug,
                    (string) $photo->id,
                );

                $photo->update(['image_url' => $imageUrl]);
            }
        } finally {
            DB::setDefaultConnection($previous);
            Config::set('database.connections.tenant.search_path', $previousPath);
            DB::purge('tenant');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Tenant $tenant): array
    {
        $tipo = $tenant->tipo ?: Tenant::TYPE_RESTAURANT;
        $catalogId = $tipo === Tenant::TYPE_TOUR_SPOT
            ? $tenant->tourSpot?->id
            : $tenant->pubRestaurant?->id;

        return [
            'id' => $tenant->id,
            'catalog_id' => $catalogId,
            'slug' => $tenant->slug,
            'schema_name' => $tenant->schema_name,
            'tipo' => $tipo,
            'subdomain_host' => $tenant->subdomainHost(),
            'subdomain_url' => $tenant->subdomainUrl(),
            'razon_social' => $tenant->razon_social,
            'nombre_comercial' => $tenant->nombre_comercial,
            'descripcion' => $tenant->descripcion,
            'ruc' => $tenant->ruc,
            'email_admin' => $tenant->email_admin,
            'telefono' => $tenant->telefono,
            'direccion' => $tenant->direccion,
            'latitud' => $tenant->latitud !== null ? (float) $tenant->latitud : null,
            'longitud' => $tenant->longitud !== null ? (float) $tenant->longitud : null,
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
