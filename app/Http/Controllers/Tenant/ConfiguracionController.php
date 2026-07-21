<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreCatalogProposalRequest;
use App\Http\Requests\Tenant\StoreVenuePhotoRequest;
use App\Http\Requests\Tenant\UpdateConfigBillingRequest;
use App\Http\Requests\Tenant\UpdateConfigHoursRequest;
use App\Http\Requests\Tenant\UpdateConfigProfileRequest;
use App\Http\Requests\Tenant\UpdateConfigPublicationRequest;
use App\Http\Requests\Tenant\UpdateConfigReservationsRequest;
use App\Http\Requests\Tenant\UpdateConfigTouristRequest;
use App\Http\Requests\Tenant\UpdateVenueImagesRequest;
use App\Models\RefCatalogProposal;
use App\Models\Tenant\CfgCatalogSelection;
use App\Models\Tenant\CfgServiceHour;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\CfgVenuePhoto;
use App\Models\Tenant\FelSerie;
use App\Services\Platform\PublicCatalogPublisher;
use App\Services\Platform\RefCatalogService;
use App\Services\Tenant\VenueImageStorage;
use App\Support\Fel\FelSeriePresenter;
use App\Support\RefCatalogTypes;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

/** Configuración operativa del restaurante (subdominio del tenant). */
class ConfiguracionController extends Controller
{
    public function __construct(
        private readonly RefCatalogService $catalog,
        private readonly VenueImageStorage $venueImages,
        private readonly PublicCatalogPublisher $publisher,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless(
            (bool) $request->user()?->can('tenant.settings.manage')
            || (bool) $request->user()?->can('tenant.publication.manage'),
            403,
        );

        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $settings = CfgSetting::ensureDefaults();
        CfgServiceHour::ensureDefaults();

        $serviceHours = CfgServiceHour::query()
            ->orderBy('day_of_week')
            ->get()
            ->map(fn (CfgServiceHour $row): array => [
                'day_of_week' => $row->day_of_week,
                'opens_at' => substr((string) $row->opens_at, 0, 5),
                'closes_at' => substr((string) $row->closes_at, 0, 5),
                'active' => $row->active,
            ]);

        $catalogOptions = $this->catalog->activeGrouped();
        $catalogSelectionIds = CfgCatalogSelection::selectedIds();

        $catalogProposals = RefCatalogProposal::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (RefCatalogProposal $row): array => [
                'id' => $row->id,
                'type' => $row->type,
                'suggested_name' => $row->suggested_name,
                'status' => $row->status,
                'rejection_reason' => $row->rejection_reason,
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        $venuePhotos = CfgVenuePhoto::query()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(fn (CfgVenuePhoto $row): array => [
                'id' => $row->id,
                'image_url' => $row->image_url,
                'caption' => $row->caption,
                'sort_order' => $row->sort_order,
            ]);

        return Inertia::render('configuracion/index', [
            'profile' => [
                'slug' => $tenant->slug,
                'subdomain_url' => $tenant->subdomainUrl(),
                'nombre_comercial' => $tenant->nombre_comercial,
                'razon_social' => $tenant->razon_social,
                'ruc' => $tenant->ruc,
                'telefono' => $tenant->telefono,
                'email_admin' => $tenant->email_admin,
                'direccion' => $tenant->direccion,
                'logo_url' => $tenant->logo_url,
                'portada_url' => $tenant->portada_url,
                'publicado' => $tenant->publicado,
                'onboarding_paso' => $tenant->onboarding_paso,
            ],
            'venue' => [
                'photos' => $venuePhotos,
                'max_photos' => CfgVenuePhoto::MAX_PHOTOS,
            ],
            'settings' => [
                'currency' => $settings->currency,
                'tax_rate' => (float) $settings->tax_rate,
                'prices_include_tax' => $settings->prices_include_tax,
                'issues_electronic_receipts' => (bool) ($settings->issues_electronic_receipts ?? false),
                'emite_comprobantes_sunat' => (bool) ($settings->emite_comprobantes_sunat ?? false),
                'apisunat_mode' => $settings->apisunat_mode ?? 'sandbox',
                'apisunat_configurado' => (bool) ($settings->apisunat_configurado ?? false),
                'reservations_enabled' => $settings->reservations_enabled,
                'reservation_duration_minutes' => $settings->reservation_duration_minutes,
                'min_booking_hours_ahead' => $settings->min_booking_hours_ahead,
                'max_booking_days_ahead' => $settings->max_booking_days_ahead,
                'no_show_tolerance_minutes' => $settings->no_show_tolerance_minutes,
                'auto_publish' => $settings->auto_publish,
            ],
            'service_hours' => $serviceHours,
            'catalog' => [
                'options' => $catalogOptions,
                'selection_ids' => $catalogSelectionIds,
                'type_labels' => RefCatalogTypes::labels(RefCatalogTypes::RESTAURANT),
                'proposals' => $catalogProposals,
            ],
            'fel_series' => FelSerie::query()
                ->orderBy('tipo_comprobante')
                ->orderBy('serie')
                ->get()
                ->map(fn (FelSerie $serie): array => FelSeriePresenter::serialize($serie)),
            'can' => [
                'manage' => $request->user()?->can('tenant.settings.manage'),
                'publication' => $request->user()?->can('tenant.publication.manage'),
                'invoicing' => $request->user()?->can('tenant.invoicing.manage'),
            ],
        ]);
    }

    public function updateProfile(UpdateConfigProfileRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        $tenant->update([
            'nombre_comercial' => $data['nombre_comercial'],
            'razon_social' => $data['razon_social'] ?: $data['nombre_comercial'],
            'ruc' => $data['ruc'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'email_admin' => $data['email_admin'] ?? null,
            'direccion' => $data['direccion'] ?? null,
        ]);

        $this->publisher->maybePublish($tenant->fresh(), ['ficha']);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    public function updateTourist(UpdateConfigTouristRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        if (isset($data['catalog_selection_ids']) && is_array($data['catalog_selection_ids'])) {
            $this->catalog->syncTenantSelections($tenant, $data['catalog_selection_ids']);
        }

        $this->publisher->maybePublish($tenant, ['catalogo']);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    public function updateBilling(UpdateConfigBillingRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();
        $issuesReceipts = (bool) ($data['issues_electronic_receipts'] ?? false);

        $settings = CfgSetting::ensureDefaults();
        $settings->update([
            'currency' => $data['currency'],
            'issues_electronic_receipts' => $issuesReceipts,
            'tax_rate' => $issuesReceipts
                ? $data['tax_rate']
                : 0,
            'prices_include_tax' => $issuesReceipts
                ? ($data['prices_include_tax'] ?? false)
                : true,
            'emite_comprobantes_sunat' => (bool) ($data['emite_comprobantes_sunat'] ?? false),
            'apisunat_mode' => $data['apisunat_mode'] ?? $settings->apisunat_mode ?? 'sandbox',
        ]);

        $this->applyApisunatToken($settings, $data);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyApisunatToken(CfgSetting $settings, array $data): void
    {
        if (($data['clear_apisunat'] ?? false) === true) {
            $settings->update([
                'apisunat_token_enc' => null,
                'apisunat_configurado' => false,
            ]);

            return;
        }

        if (! empty($data['apisunat_token'])) {
            $settings->update([
                'apisunat_token_enc' => Crypt::encryptString((string) $data['apisunat_token']),
                'apisunat_configurado' => true,
            ]);
        }
    }

    public function updateHours(UpdateConfigHoursRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        CfgServiceHour::syncAll($data['service_hours']);

        $this->publisher->maybePublish($tenant, ['horarios', 'disponibilidad']);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    public function updateReservations(UpdateConfigReservationsRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        $settings = CfgSetting::ensureDefaults();
        $settings->update([
            'reservations_enabled' => $data['reservations_enabled'] ?? false,
            'reservation_duration_minutes' => $data['reservation_duration_minutes'],
            'min_booking_hours_ahead' => $data['min_booking_hours_ahead'],
            'max_booking_days_ahead' => $data['max_booking_days_ahead'],
            'no_show_tolerance_minutes' => $data['no_show_tolerance_minutes'],
        ]);

        $this->publisher->maybePublish($tenant, ['disponibilidad']);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    public function updatePublication(UpdateConfigPublicationRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        $settings = CfgSetting::ensureDefaults();
        $settings->update([
            'auto_publish' => $data['auto_publish'] ?? false,
        ]);

        return back()->with('success', __('messages.configuracion.updated'));
    }

    public function storeCatalogProposal(StoreCatalogProposalRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $data = $request->validated();

        try {
            $this->catalog->propose(
                $tenant,
                $data['type'],
                $data['suggested_name'],
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['suggested_name' => $e->getMessage()]);
        }

        return back()->with('success', __('messages.catalog.proposal_sent'));
    }

    public function updateVenueImages(UpdateVenueImagesRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $slug = (string) $tenant->slug;
        $changed = false;

        if ($request->hasFile('logo')) {
            $this->venueImages->deleteBranded($slug, 'logo', $tenant->logo_url);
            $tenant->logo_url = $this->venueImages->storeBranded(
                $request->file('logo'),
                $slug,
                'logo',
            );
            $changed = true;
        } elseif ($request->boolean('remove_logo')) {
            $this->venueImages->deleteBranded($slug, 'logo', $tenant->logo_url);
            $tenant->logo_url = null;
            $changed = true;
        }

        if ($request->hasFile('portada')) {
            $this->venueImages->deleteBranded($slug, 'portada', $tenant->portada_url);
            $tenant->portada_url = $this->venueImages->storeBranded(
                $request->file('portada'),
                $slug,
                'portada',
            );
            $changed = true;
        } elseif ($request->boolean('remove_portada')) {
            $this->venueImages->deleteBranded($slug, 'portada', $tenant->portada_url);
            $tenant->portada_url = null;
            $changed = true;
        }

        if ($changed) {
            $tenant->save();
            $this->publisher->maybePublish($tenant->fresh(), ['ficha', 'galeria']);
        }

        return back()->with('success', __('messages.configuracion.venue_images_updated'));
    }

    public function storeVenuePhoto(StoreVenuePhotoRequest $request): RedirectResponse
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $currentCount = CfgVenuePhoto::query()->count();

        if ($currentCount >= CfgVenuePhoto::MAX_PHOTOS) {
            return back()->withErrors([
                'image' => __('messages.configuracion.venue_gallery_limit', [
                    'max' => CfgVenuePhoto::MAX_PHOTOS,
                ]),
            ]);
        }

        $sortOrder = (int) CfgVenuePhoto::query()->max('sort_order') + 1;
        $photo = CfgVenuePhoto::query()->create([
            'caption' => $request->validated('caption'),
            'sort_order' => $sortOrder,
            'image_url' => '',
        ]);

        $imageUrl = $this->venueImages->storeGallery(
            $request->file('image'),
            (string) $tenant->slug,
            (string) $photo->id,
        );

        $photo->update(['image_url' => $imageUrl]);
        $this->publisher->maybePublish($tenant, ['galeria']);

        return back()->with('success', __('messages.configuracion.venue_photo_added'));
    }

    public function destroyVenuePhoto(CfgVenuePhoto $venuePhoto): RedirectResponse
    {
        abort_unless((bool) request()->user()?->can('tenant.settings.manage'), 403);

        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        $this->venueImages->deleteGalleryPhoto(
            (string) $tenant->slug,
            (string) $venuePhoto->id,
            $venuePhoto->image_url,
        );

        $venuePhoto->delete();
        $this->publisher->maybePublish($tenant, ['galeria']);

        return back()->with('success', __('messages.configuracion.venue_photo_removed'));
    }
}
