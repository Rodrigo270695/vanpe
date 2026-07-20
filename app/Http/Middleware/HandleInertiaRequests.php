<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $manager = app(TenantManager::class);
        $tenant = $manager->tenant();
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'roles' => $user && method_exists($user, 'getRoleNames')
                    ? $user->getRoleNames()->all()
                    : [],
                'permissions' => $user && method_exists($user, 'getAllPermissions')
                    ? $user->getAllPermissions()->pluck('name')->all()
                    : [],
            ],
            'tenant' => $tenant === null ? null : [
                'slug' => $tenant->slug,
                'name' => $tenant->nombre_comercial,
            ],
            'timezone' => $tenant?->timezone ?: 'America/Lima',
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => App::getLocale(),
            'availableLocales' => SetLocale::SUPPORTED,
            'translations' => (array) trans('messages'),
            'flash' => [
                'toast' => $this->resolveToast($request),
            ],
            'push' => $this->resolvePushConfig($request, $manager, $user),
        ];
    }

    /**
     * @return array{enabled: bool, vapidPublicKey: string|null}|null
     */
    private function resolvePushConfig(Request $request, TenantManager $manager, mixed $user): ?array
    {
        if ($user === null || ! $manager->check()) {
            return null;
        }

        $publicKey = trim((string) config('webpush.vapid.public_key', ''));

        return [
            'enabled' => filled($publicKey),
            'vapidPublicKey' => filled($publicKey) ? $publicKey : null,
        ];
    }

    /**
     * Convierte los mensajes flash de sesión en un toast para el frontend.
     *
     * @return array{type: string, message: string, id: string}|null
     */
    private function resolveToast(Request $request): ?array
    {
        foreach (['error', 'warning', 'info', 'success'] as $type) {
            if ($request->session()->has($type)) {
                return [
                    'type' => $type,
                    'message' => (string) $request->session()->get($type),
                    'id' => (string) Str::uuid(),
                ];
            }
        }

        return null;
    }
}
