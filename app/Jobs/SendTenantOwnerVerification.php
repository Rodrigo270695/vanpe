<?php

namespace App\Jobs;

use App\Mail\TenantOwnerVerifyMail;
use App\Models\Tenant;
use App\Services\Tenant\TenantProvisioner;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Throwable;

class SendTenantOwnerVerification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 60;

    /** @var list<int> */
    public array $backoff = [60, 300, 900, 1800];

    public function __construct(
        public readonly string $tenantId,
    ) {
        $this->onQueue('mail');
    }

    public function handle(TenantProvisioner $provisioner): void
    {
        $tenant = Tenant::query()->findOrFail($this->tenantId);

        try {
            $owner = $provisioner->getOwner($tenant);

            if ($owner === null || $owner->email_verified_at !== null) {
                return;
            }

            $verifyUrl = URL::temporarySignedRoute(
                'tenant.verify',
                now()->addMinutes(60),
                [
                    'tenant' => $tenant->id,
                    'user' => $owner->id,
                    'hash' => sha1((string) $owner->email),
                ],
            );

            Mail::to($owner->email)->send(new TenantOwnerVerifyMail(
                ownerName: $owner->name,
                restaurantName: $tenant->nombre_comercial,
                subdomain: $tenant->subdomainHost(),
                verifyUrl: $verifyUrl,
            ));
        } finally {
            Config::set('database.connections.tenant.search_path', 'public');
            DB::purge('tenant');
        }
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('No se pudo enviar la verificación del dueño del tenant.', [
            'tenant_id' => $this->tenantId,
            'exception' => $exception?->getMessage(),
        ]);
    }
}
