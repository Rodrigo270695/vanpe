<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\OwnerOnboardingController;
use App\Http\Controllers\Auth\StaffInvitationController;
use App\Http\Controllers\Auth\TenantEmailVerificationController;
use App\Http\Controllers\Auth\TenantRegistrationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentLookupController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\Platform\CatalogController;
use App\Http\Controllers\Platform\PlanController;
use App\Http\Controllers\Platform\PlanFeatureController;
use App\Http\Controllers\Platform\PromoCodeController;
use App\Http\Controllers\Platform\RoleController;
use App\Http\Controllers\Platform\SubscriptionController;
use App\Http\Controllers\Platform\SubscriptionPaymentController;
use App\Http\Controllers\Platform\TenantController;
use App\Http\Controllers\Platform\TourSpotController;
use App\Http\Controllers\Platform\UserController;
use App\Http\Controllers\Tenant\CajaController;
use App\Http\Controllers\Tenant\CartaController;
use App\Http\Controllers\Tenant\CocinaController;
use App\Http\Controllers\Tenant\ConfiguracionController;
use App\Http\Controllers\Tenant\FelDocumentController;
use App\Http\Controllers\Tenant\FelSerieController;
use App\Http\Controllers\Tenant\MesasController;
use App\Http\Controllers\Tenant\PedidosController;
use App\Http\Controllers\Tenant\PushSubscriptionController;
use App\Http\Controllers\Tenant\ReportesController;
use App\Http\Controllers\Tenant\ReservasController;
use App\Http\Controllers\Tenant\VentasController;
use App\Http\Controllers\Tenant\WaitingListController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::match(['get', 'head'], 'sw.js', function () {
    $path = public_path('build/sw.js');

    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->name('pwa.service-worker');

Route::match(['get', 'head'], 'push-sw.js', function () {
    $path = public_path('push-sw.js');

    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->name('pwa.push-service-worker');

if (app()->environment('local')) {
    Route::view('push-test', 'push-test', [
        'vapidPublicKey' => config('webpush.vapid.public_key'),
    ])->name('push.test');
}

Route::post('locale/{locale}', [LocaleController::class, 'update'])->name('locale.update');

Route::middleware('guest')->group(function () {
    // Registro del dueño de restaurante (crea el tenant completo).
    // Solo en el dominio central (no dentro del subdominio de un tenant).
    Route::middleware('tenant.none')->group(function () {
        Route::get('register', [TenantRegistrationController::class, 'create'])->name('register');
        Route::post('register', [TenantRegistrationController::class, 'store'])->name('register.store');
        Route::get('email/verificacion/reenviar', [TenantRegistrationController::class, 'createVerificationResend'])
            ->name('tenant.verification.resend');
        Route::post('email/verificacion/reenviar', [TenantRegistrationController::class, 'resendVerification'])
            ->middleware('throttle:6,1')
            ->name('tenant.verification.resend.store');

        Route::get('auth/google/redirect', [GoogleController::class, 'redirect'])
            ->name('google.redirect');
        Route::get('auth/google/callback', [GoogleController::class, 'callback'])
            ->name('google.callback');

        // Onboarding del dueño tras autenticar con Google (completa restaurante).
        Route::get('registro/completar', [OwnerOnboardingController::class, 'create'])
            ->name('owner.onboarding');
        Route::post('registro/completar', [OwnerOnboardingController::class, 'store'])
            ->name('owner.onboarding.store');
    });
});

// Confirmación de correo del dueño (enlace firmado, usuario en schema del tenant).
Route::get('email/verificar/{tenant}/{user}/{hash}', TenantEmailVerificationController::class)
    ->middleware('signed')
    ->name('tenant.verify');

// Invitación de personal: el miembro define su contraseña (enlace firmado).
Route::middleware('signed')->group(function () {
    Route::get('invitacion/{tenant}/{user}/{hash}', [StaffInvitationController::class, 'show'])
        ->name('staff.invitation.accept');
    Route::post('invitacion/{tenant}/{user}/{hash}', [StaffInvitationController::class, 'store'])
        ->name('staff.invitation.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Gestión de roles. Misma pantalla en el dominio central (superadmin,
    // roles de plataforma) y en el subdominio del restaurante (owner, roles
    // de SU schema). El RoleController resuelve el ámbito por contexto.
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::put('roles/{role}/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // Gestión de usuarios (personal en el restaurante / usuarios de plataforma).
    Route::get('usuarios', [UserController::class, 'index'])->name('users.index');
    Route::post('usuarios', [UserController::class, 'store'])->name('users.store');
    Route::put('usuarios/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('usuarios/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('usuarios/{user}/invitacion', [UserController::class, 'resendInvitation'])->name('users.invite');

    // Consulta de datos por documento (RENIEC vía apiperu.dev).
    Route::get('documento/dni/{numero}', [DocumentLookupController::class, 'dni'])
        ->where('numero', '[0-9]{8}')
        ->name('document.dni');
    Route::get('documento/ruc/{numero}', [DocumentLookupController::class, 'ruc'])
        ->where('numero', '[0-9]{11}')
        ->name('document.ruc');

    // Operación del restaurante (solo subdominio del tenant).
    Route::middleware('tenant.required')->group(function () {
        Route::get('mesas', [MesasController::class, 'index'])->name('mesas.index');
        Route::post('mesas/areas', [MesasController::class, 'storeArea'])->name('mesas.areas.store');
        Route::put('mesas/areas/{area}', [MesasController::class, 'updateArea'])->name('mesas.areas.update');
        Route::delete('mesas/areas/{area}', [MesasController::class, 'destroyArea'])->name('mesas.areas.destroy');
        Route::post('mesas/tables', [MesasController::class, 'storeTable'])->name('mesas.tables.store');
        Route::put('mesas/tables/{table}', [MesasController::class, 'updateTable'])->name('mesas.tables.update');
        Route::delete('mesas/tables/{table}', [MesasController::class, 'destroyTable'])->name('mesas.tables.destroy');

        Route::get('carta', [CartaController::class, 'index'])->name('carta.index');
        Route::post('carta/categories', [CartaController::class, 'storeCategory'])->name('carta.categories.store');
        Route::put('carta/categories/{category}', [CartaController::class, 'updateCategory'])->name('carta.categories.update');
        Route::delete('carta/categories/{category}', [CartaController::class, 'destroyCategory'])->name('carta.categories.destroy');
        Route::post('carta/dishes', [CartaController::class, 'storeDish'])->name('carta.dishes.store');
        Route::put('carta/dishes/{dish}', [CartaController::class, 'updateDish'])->name('carta.dishes.update');
        Route::delete('carta/dishes/{dish}', [CartaController::class, 'destroyDish'])->name('carta.dishes.destroy');

        Route::get('pedidos', [PedidosController::class, 'index'])->name('pedidos.index');
        Route::post('pedidos', [PedidosController::class, 'store'])->name('pedidos.store');
        Route::get('pedidos/mesa/{table}', [PedidosController::class, 'openForTable'])->name('pedidos.open-table');
        Route::get('pedidos/{pedido}', [PedidosController::class, 'show'])->name('pedidos.show');
        Route::put('pedidos/{pedido}/items/{item}/selections', [PedidosController::class, 'updateItemSelections'])->name('pedidos.items.selections.update');
        Route::post('pedidos/{pedido}/items', [PedidosController::class, 'addItem'])->name('pedidos.items.store');
        Route::put('pedidos/{pedido}/items/{item}', [PedidosController::class, 'updateItem'])->name('pedidos.items.update');
        Route::delete('pedidos/{pedido}/items/{item}', [PedidosController::class, 'removeItem'])->name('pedidos.items.destroy');
        Route::post('pedidos/{pedido}/send', [PedidosController::class, 'sendToKitchen'])->name('pedidos.send');
        Route::post('pedidos/{pedido}/served', [PedidosController::class, 'markServed'])->name('pedidos.served');
        Route::post('pedidos/{pedido}/close', [PedidosController::class, 'close'])->name('pedidos.close');
        Route::post('pedidos/{pedido}/cancel', [PedidosController::class, 'cancel'])->name('pedidos.cancel');

        Route::get('cocina', [CocinaController::class, 'index'])->name('cocina.index');
        Route::post('cocina/items/{item}/ready', [CocinaController::class, 'markItemReady'])->name('cocina.items.ready');

        Route::get('caja', [CajaController::class, 'index'])->name('caja.index');
        Route::post('caja/open', [CajaController::class, 'open'])->name('caja.open');
        Route::post('caja/close', [CajaController::class, 'close'])->name('caja.close');
        Route::post('caja/cobrar/{pedido}', [CajaController::class, 'charge'])->name('caja.charge');

        Route::get('ventas', [VentasController::class, 'index'])->name('ventas.index');
        Route::get('ventas/{venta}', [VentasController::class, 'show'])->name('ventas.show');
        Route::post('ventas/{venta}/anular', [VentasController::class, 'void'])->name('ventas.void');
        Route::post('ventas/{venta}/emitir-fel', [VentasController::class, 'emitFel'])->name('ventas.emit_fel');

        Route::get('facturacion/series', [FelSerieController::class, 'index'])->name('facturacion.series.index');
        Route::post('facturacion/series', [FelSerieController::class, 'store'])->name('facturacion.series.store');
        Route::put('facturacion/series/{felSerie}', [FelSerieController::class, 'update'])->name('facturacion.series.update');
        Route::delete('facturacion/series/{felSerie}', [FelSerieController::class, 'destroy'])->name('facturacion.series.destroy');

        Route::get('facturacion/documentos', [FelDocumentController::class, 'index'])->name('facturacion.documentos.index');
        Route::post('facturacion/documentos/{felDocument}/reemitir', [FelDocumentController::class, 'reemit'])->name('facturacion.documentos.reemit');
        Route::get('facturacion/documentos/{felDocument}/xml', [FelDocumentController::class, 'downloadXml'])->name('facturacion.documentos.xml');
        Route::get('facturacion/documentos/{felDocument}/cdr', [FelDocumentController::class, 'downloadCdr'])->name('facturacion.documentos.cdr');
        Route::get('facturacion/documentos/{felDocument}/json', [FelDocumentController::class, 'json'])->name('facturacion.documentos.json');

        Route::get('reportes', [ReportesController::class, 'index'])->name('reportes.index');

        Route::post('push/subscribe', [PushSubscriptionController::class, 'store'])->name('push.subscribe');
        Route::delete('push/subscribe', [PushSubscriptionController::class, 'destroy'])->name('push.unsubscribe');

        Route::get('configuracion', [ConfiguracionController::class, 'index'])->name('configuracion.index');
        Route::put('configuracion/profile', [ConfiguracionController::class, 'updateProfile'])->name('configuracion.profile.update');
        Route::put('configuracion/tourist', [ConfiguracionController::class, 'updateTourist'])->name('configuracion.tourist.update');
        Route::put('configuracion/billing', [ConfiguracionController::class, 'updateBilling'])->name('configuracion.billing.update');
        Route::put('configuracion/hours', [ConfiguracionController::class, 'updateHours'])->name('configuracion.hours.update');
        Route::put('configuracion/reservations', [ConfiguracionController::class, 'updateReservations'])->name('configuracion.reservations.update');
        Route::put('configuracion/publication', [ConfiguracionController::class, 'updatePublication'])->name('configuracion.publication.update');
        Route::post('configuracion/venue-images', [ConfiguracionController::class, 'updateVenueImages'])
            ->name('configuracion.venue-images.update');
        Route::post('configuracion/venue-photos', [ConfiguracionController::class, 'storeVenuePhoto'])
            ->name('configuracion.venue-photos.store');
        Route::delete('configuracion/venue-photos/{venuePhoto}', [ConfiguracionController::class, 'destroyVenuePhoto'])
            ->name('configuracion.venue-photos.destroy');
        Route::post('configuracion/catalog-proposals', [ConfiguracionController::class, 'storeCatalogProposal'])
            ->name('configuracion.catalog-proposals.store');

        Route::get('reservas', [ReservasController::class, 'index'])->name('reservas.index');
        Route::post('reservas', [ReservasController::class, 'store'])->name('reservas.store');
        Route::put('reservas/{reservation}', [ReservasController::class, 'update'])->name('reservas.update');
        Route::post('reservas/{reservation}/confirm', [ReservasController::class, 'confirm'])->name('reservas.confirm');
        Route::post('reservas/{reservation}/reject', [ReservasController::class, 'reject'])->name('reservas.reject');
        Route::post('reservas/{reservation}/seat', [ReservasController::class, 'seat'])->name('reservas.seat');
        Route::post('reservas/{reservation}/complete', [ReservasController::class, 'complete'])->name('reservas.complete');
        Route::post('reservas/{reservation}/no-show', [ReservasController::class, 'noShow'])->name('reservas.no_show');
        Route::post('reservas/{reservation}/cancel', [ReservasController::class, 'cancel'])->name('reservas.cancel');

        Route::post('lista-espera', [WaitingListController::class, 'store'])->name('lista-espera.store');
        Route::post('lista-espera/{listaEspera}/sentar', [WaitingListController::class, 'seat'])->name('lista-espera.seat');
        Route::post('lista-espera/{listaEspera}/retirar', [WaitingListController::class, 'withdraw'])->name('lista-espera.withdraw');
    });

    // SaaS: planes, features y suscripciones (solo dominio central).
    Route::middleware('tenant.none')->group(function () {
        Route::get('restaurantes', [TenantController::class, 'index'])->name('tenants.index');
        Route::post('restaurantes', [TenantController::class, 'store'])->name('tenants.store');
        Route::put('restaurantes/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::delete('restaurantes/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');

        Route::get('planes', [PlanController::class, 'index'])->name('plans.index');
        Route::post('planes', [PlanController::class, 'store'])->name('plans.store');
        Route::put('planes/{plan}', [PlanController::class, 'update'])->name('plans.update');
        Route::delete('planes/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');

        Route::get('plan-features', [PlanFeatureController::class, 'index'])->name('plan-features.index');
        Route::post('plan-features', [PlanFeatureController::class, 'store'])->name('plan-features.store');
        Route::put('plan-features/{plan_feature}', [PlanFeatureController::class, 'update'])->name('plan-features.update');
        Route::delete('plan-features/{plan_feature}', [PlanFeatureController::class, 'destroy'])->name('plan-features.destroy');

        Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::post('subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
        Route::put('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
        Route::delete('subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');

        Route::get('subscription-payments', [SubscriptionPaymentController::class, 'index'])->name('subscription-payments.index');
        Route::post('subscription-payments', [SubscriptionPaymentController::class, 'store'])->name('subscription-payments.store');
        Route::put('subscription-payments/{subscription_payment}', [SubscriptionPaymentController::class, 'update'])->name('subscription-payments.update');
        Route::delete('subscription-payments/{subscription_payment}', [SubscriptionPaymentController::class, 'destroy'])->name('subscription-payments.destroy');

        Route::get('promo-codes', [PromoCodeController::class, 'index'])->name('promo-codes.index');
        Route::post('promo-codes', [PromoCodeController::class, 'store'])->name('promo-codes.store');
        Route::put('promo-codes/{promo_code}', [PromoCodeController::class, 'update'])->name('promo-codes.update');
        Route::delete('promo-codes/{promo_code}', [PromoCodeController::class, 'destroy'])->name('promo-codes.destroy');

        Route::get('catalogo', [CatalogController::class, 'index'])->name('catalog.index');
        Route::post('catalogo/items', [CatalogController::class, 'store'])->name('catalog.items.store');
        Route::put('catalogo/items/{catalogItem}', [CatalogController::class, 'update'])->name('catalog.items.update');
        Route::delete('catalogo/items/{catalogItem}', [CatalogController::class, 'destroy'])->name('catalog.items.destroy');
        Route::post('catalogo/proposals/{proposal}/approve', [CatalogController::class, 'approveProposal'])
            ->name('catalog.proposals.approve');
        Route::post('catalogo/proposals/{proposal}/reject', [CatalogController::class, 'rejectProposal'])
            ->name('catalog.proposals.reject');

        Route::get('centros-turisticos', [TourSpotController::class, 'index'])->name('tour-spots.index');
        Route::get('centros-turisticos/geo/provincias', [TourSpotController::class, 'provincias'])
            ->name('tour-spots.geo.provincias');
        Route::get('centros-turisticos/geo/distritos', [TourSpotController::class, 'distritos'])
            ->name('tour-spots.geo.distritos');
        Route::post('centros-turisticos/categories', [TourSpotController::class, 'storeCategory'])
            ->name('tour-spots.categories.store');
        Route::post('centros-turisticos/access-modes', [TourSpotController::class, 'storeAccessMode'])
            ->name('tour-spots.access-modes.store');
        Route::post('centros-turisticos/road-types', [TourSpotController::class, 'storeRoadType'])
            ->name('tour-spots.road-types.store');
        Route::post('centros-turisticos/inclusions', [TourSpotController::class, 'storeInclusion'])
            ->name('tour-spots.inclusions.store');
        Route::post('centros-turisticos', [TourSpotController::class, 'store'])->name('tour-spots.store');
        Route::put('centros-turisticos/{tour_spot}', [TourSpotController::class, 'update'])->name('tour-spots.update');
        Route::delete('centros-turisticos/{tour_spot}', [TourSpotController::class, 'destroy'])->name('tour-spots.destroy');
    });
});

require __DIR__.'/settings.php';
