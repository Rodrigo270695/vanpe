<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\UserRequest;
use App\Mail\StaffInvitationMail;
use App\Models\Permission\Role;
use App\Models\Tenant;
use App\Models\Tenant\User as TenantUser;
use App\Models\User as PlatformUser;
use App\Support\PermissionCatalog;
use App\Tenancy\TenantManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestión de usuarios. Misma pantalla para dos ámbitos:
 *
 *  - Plataforma (dominio central): el superadmin gestiona los usuarios del
 *    schema public. Autorización granular (users.view/create/update/...).
 *  - Restaurante (subdominio): el dueño gestiona el personal de SU schema
 *    (rst_*). Autorización por la capacidad 'tenant.users.manage'.
 */
class UserController extends Controller
{
    private const GUARD = 'web';

    private function scope(): string
    {
        return app(TenantManager::class)->check() ? 'tenant' : 'platform';
    }

    private function isTenant(): bool
    {
        return $this->scope() === 'tenant';
    }

    /**
     * @return class-string<Model>
     */
    private function userModel(): string
    {
        return $this->isTenant() ? TenantUser::class : PlatformUser::class;
    }

    /**
     * Habilidad requerida para cada acción según el scope.
     *
     * @return array<string, string>
     */
    private function abilities(string $scope): array
    {
        if ($scope === 'tenant') {
            $manage = (string) config('permissions.tenant.manage_ability', 'tenant.users.manage');

            return [
                'view' => $manage,
                'create' => $manage,
                'update' => $manage,
                'delete' => $manage,
                'roles' => $manage,
            ];
        }

        return [
            'view' => 'users.view',
            'create' => 'users.create',
            'update' => 'users.update',
            'delete' => 'users.delete',
            'roles' => 'users.roles',
        ];
    }

    private function authorize(Request $request, string $action): void
    {
        $ability = $this->abilities($this->scope())[$action];

        abort_unless((bool) $request->user()?->can($ability), 403);
    }

    /**
     * Roles "protegidos" del scope: quien los tiene no se puede eliminar y su
     * rol no se puede cambiar (superadmin en plataforma, owner en restaurante).
     *
     * @return array<int, string>
     */
    private function protectedRoles(string $scope): array
    {
        return PermissionCatalog::coreRoles($scope);
    }

    public function index(Request $request): Response
    {
        $scope = $this->scope();
        $this->authorize($request, 'view');

        $protected = $this->protectedRoles($scope);
        $abilities = $this->abilities($scope);
        $authId = $request->user()?->getKey();
        $model = $this->userModel();

        $users = $model::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->get()
            ->map(function (Model $user) use ($protected, $authId): array {
                /** @var \Illuminate\Support\Collection<int, string> $roleNames */
                $roleNames = method_exists($user, 'getRoleNames')
                    ? $user->getRoleNames()
                    : collect();

                return [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'paternal_surname' => $user->paternal_surname,
                    'maternal_surname' => $user->maternal_surname,
                    'document_type' => $user->document_type,
                    'document_number' => $user->document_number,
                    'email' => $user->email,
                    'username' => $user->username,
                    'roles' => $roleNames->values()->all(),
                    'active' => (bool) ($user->activo ?? true),
                    'is_self' => (string) $user->getKey() === (string) $authId,
                    'is_protected' => $roleNames->intersect($protected)->isNotEmpty()
                        || (bool) ($user->es_owner ?? false),
                    'is_pending' => $this->isTenant() && $user->email_verified_at === null,
                    'created_at' => $user->created_at?->toISOString(),
                ];
            })
            ->all();

        $roles = Role::query()
            ->where('guard_name', self::GUARD)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $user = $request->user();

        return Inertia::render('usuarios/index', [
            'users' => $users,
            'scope' => $scope,
            'availableRoles' => $roles,
            'can' => [
                'create' => (bool) $user?->can($abilities['create']),
                'update' => (bool) $user?->can($abilities['update']),
                'delete' => (bool) $user?->can($abilities['delete']),
                'roles' => (bool) $user?->can($abilities['roles']),
            ],
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $invite = $request->wantsInvite();
        $model = $request->userModel();
        $data = $request->validated();

        /** @var Model $user */
        $user = new $model;
        $this->fillPersonFields($user, $data);
        $user->email = $data['email'];
        $user->username = $data['username'] ?: $this->suggestUsername($data) ?: Str::before($data['email'], '@');
        // Si es por invitación, contraseña temporal aleatoria (la fija el usuario).
        $user->password = Hash::make($invite ? Str::password(24) : $data['password']);
        $user->activo = $data['active'] ?? true;

        if ($this->isTenant()) {
            $user->es_owner = false;
            $user->email_verified_at = $invite ? null : now();
        } else {
            $user->email_verified_at = now();
        }

        $user->save();

        if (method_exists($user, 'syncRoles')) {
            $user->syncRoles($data['roles'] ?? []);
        }

        if ($invite && $user instanceof TenantUser) {
            $tenant = app(TenantManager::class)->tenant();

            if ($tenant !== null) {
                $this->sendStaffInvitation($tenant, $user);

                return back()->with(
                    'success',
                    __('messages.users.invite_sent', ['email' => $user->email]),
                );
            }
        }

        return back()->with('success', __('messages.users.created'));
    }

    /**
     * Reenvía la invitación a un miembro del personal que aún no la activó.
     */
    public function resendInvitation(Request $request, string $user): RedirectResponse
    {
        $this->authorize($request, 'create');

        abort_unless($this->isTenant(), 404);

        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        /** @var TenantUser $target */
        $target = TenantUser::query()->findOrFail($user);

        abort_if(
            $target->email_verified_at !== null,
            422,
            __('messages.users.already_active'),
        );

        $this->sendStaffInvitation($tenant, $target);

        return back()->with('success', __('messages.users.invite_resent', ['email' => $target->email]));
    }

    private function sendStaffInvitation(Tenant $tenant, TenantUser $user): void
    {
        $acceptUrl = URL::temporarySignedRoute(
            'staff.invitation.accept',
            now()->addHours(72),
            [
                'tenant' => $tenant->id,
                'user' => $user->getKey(),
                'hash' => sha1((string) $user->email),
            ],
        );

        Mail::to($user->email)->send(new StaffInvitationMail(
            staffName: $user->name,
            restaurantName: $tenant->nombre_comercial,
            roleLabel: $user->getRoleNames()->implode(', '),
            acceptUrl: $acceptUrl,
            subdomainHost: $tenant->subdomainHost(),
        ));
    }

    public function update(UserRequest $request, string $user): RedirectResponse
    {
        $scope = $request->scope();
        $model = $request->userModel();

        /** @var Model $target */
        $target = $model::query()->findOrFail($user);

        $data = $request->validated();

        $this->fillPersonFields($target, $data);
        $target->email = $data['email'];
        $target->username = $data['username'] ?: $this->suggestUsername($data) ?: Str::before($data['email'], '@');

        if (! empty($data['password'])) {
            $target->password = Hash::make($data['password']);
        }

        // El estado se puede cambiar salvo en el dueño o en tu propia cuenta
        // (evita que te desactives y te quedes fuera).
        $isSelf = (string) $target->getKey() === (string) $request->user()?->getKey();

        if (! ($target->es_owner ?? false) && ! $isSelf) {
            $target->activo = $data['active'] ?? true;
        }

        $target->save();

        // El rol del sistema (superadmin/owner) no se puede cambiar.
        $isProtected = $this->userIsProtected($target, $scope);

        if (method_exists($target, 'syncRoles') && ! $isProtected) {
            $target->syncRoles($data['roles'] ?? []);
        }

        return back()->with('success', __('messages.users.updated'));
    }

    public function destroy(Request $request, string $user): RedirectResponse
    {
        $scope = $this->scope();
        $this->authorize($request, 'delete');

        $model = $this->userModel();
        /** @var Model $target */
        $target = $model::query()->findOrFail($user);

        abort_if(
            (string) $target->getKey() === (string) $request->user()?->getKey(),
            403,
            __('messages.users.cannot_delete_self'),
        );

        abort_if(
            $this->userIsProtected($target, $scope),
            403,
            __('messages.users.protected_delete'),
        );

        $target->delete();

        return back()->with('success', __('messages.users.deleted'));
    }

    private function userIsProtected(Model $user, string $scope): bool
    {
        if ($user->es_owner ?? false) {
            return true;
        }

        if (! method_exists($user, 'getRoleNames')) {
            return false;
        }

        return $user->getRoleNames()
            ->intersect($this->protectedRoles($scope))
            ->isNotEmpty();
    }

    /**
     * Asigna los campos de identidad y compone el nombre completo (name).
     *
     * @param  array<string, mixed>  $data
     */
    private function fillPersonFields(Model $user, array $data): void
    {
        $user->first_name = $data['first_name'];
        $user->paternal_surname = $data['paternal_surname'];
        $user->maternal_surname = $data['maternal_surname'] ?? null;
        $user->document_type = $data['document_type'] ?? null;
        $user->document_number = $data['document_number'] ?? null;
        $user->name = $this->composeName($data);
    }

    /**
     * Nombre completo: nombres + apellido paterno + apellido materno.
     *
     * @param  array<string, mixed>  $data
     */
    private function composeName(array $data): string
    {
        $full = trim(implode(' ', array_filter([
            trim((string) ($data['first_name'] ?? '')),
            trim((string) ($data['paternal_surname'] ?? '')),
            trim((string) ($data['maternal_surname'] ?? '')),
        ])));

        return $full !== '' ? $full : (string) ($data['name'] ?? '');
    }

    /**
     * Usuario sugerido: 1.ª letra del primer nombre + apellido paterno +
     * 1.ª letra del apellido materno (sin tildes ni espacios, en minúsculas).
     *
     * @param  array<string, mixed>  $data
     */
    private function suggestUsername(array $data): string
    {
        $firstGiven = preg_split('/\s+/', trim((string) ($data['first_name'] ?? '')))[0] ?? '';
        $paternal = trim((string) ($data['paternal_surname'] ?? ''));
        $maternal = trim((string) ($data['maternal_surname'] ?? ''));

        $raw = mb_substr($firstGiven, 0, 1).$paternal.mb_substr($maternal, 0, 1);
        $ascii = Str::ascii($raw);

        return strtolower((string) preg_replace('/[^a-zA-Z0-9]/', '', $ascii));
    }
}
