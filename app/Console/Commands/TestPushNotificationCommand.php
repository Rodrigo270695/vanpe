<?php

namespace App\Console\Commands;

use App\Models\Tenant\PushSubscription;
use App\Models\Tenant\User;
use App\Services\Tenant\PushNotificationService;
use App\Tenancy\Exceptions\TenantNotFoundException;
use App\Tenancy\TenantManager;
use Illuminate\Console\Command;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class TestPushNotificationCommand extends Command
{
    protected $signature = 'webpush:test
        {--tenant= : Slug del tenant}
        {--email= : Correo del usuario destino}
        {--dry-run : Solo muestra suscripciones sin enviar}';

    protected $description = 'Envía una notificación push de prueba a un usuario del tenant';

    public function handle(TenantManager $manager, PushNotificationService $push): int
    {
        $tenantSlug = (string) ($this->option('tenant') ?: 'negritalinda');

        try {
            $manager->resolveBySlug($tenantSlug);
        } catch (TenantNotFoundException) {
            $this->components->error("No se encontró el tenant «{$tenantSlug}».");

            return self::FAILURE;
        }

        if (! $push->isConfigured()) {
            $this->components->error('Las claves VAPID no están configuradas en .env');

            return self::FAILURE;
        }

        $email = (string) ($this->option('email') ?: '');
        $userQuery = User::query()->where('activo', true);

        if ($email !== '') {
            $userQuery->where('email', $email);
        }

        $user = $userQuery->orderBy('id')->first();

        if ($user === null) {
            $this->components->error('No hay usuario activo para enviar la prueba.');

            return self::FAILURE;
        }

        $subscriptions = PushSubscription::query()
            ->where('user_id', $user->id)
            ->get();

        if ($subscriptions->isEmpty()) {
            $this->components->warn("El usuario {$user->email} no tiene suscripciones push.");
            $this->line('Activa las notificaciones en el navegador (banner «Activar») y vuelve a ejecutar este comando.');

            return self::FAILURE;
        }

        $this->components->info("Tenant: {$tenantSlug}");
        $this->line("Usuario: {$user->email} ({$subscriptions->count()} suscripción/es)");

        foreach ($subscriptions as $subscription) {
            $this->line('- '.substr($subscription->endpoint, 0, 72).'...');
        }

        if ($this->option('dry-run')) {
            return self::SUCCESS;
        }

        $payload = json_encode([
            'title' => 'VanPe — prueba push',
            'body' => 'Si ves esto, las notificaciones push funcionan correctamente.',
            'url' => '/pedidos',
            'tag' => 'vanpe-push-test',
        ], JSON_THROW_ON_ERROR);

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => (string) config('webpush.vapid.subject'),
                'publicKey' => (string) config('webpush.vapid.public_key'),
                'privateKey' => (string) config('webpush.vapid.private_key'),
            ],
        ]);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding,
                ]),
                $payload,
            );
        }

        $failed = 0;

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $this->components->info('Enviado correctamente.');

                continue;
            }

            $failed++;
            $this->components->error($report->getReason());
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
