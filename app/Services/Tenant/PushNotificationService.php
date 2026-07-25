<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Order;
use App\Models\Tenant\OrderItem;
use App\Models\Tenant\PushSubscription;
use App\Models\Tenant\User;
use App\Support\RoleProvisioner;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Throwable;

class PushNotificationService
{
    public function isConfigured(): bool
    {
        return filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'));
    }

    public function notifyKitchenNewOrder(Order $order, ?User $except = null): void
    {
        $tableLabel = $this->tableLabel($order);

        $this->notifyUsersWithPermission(
            'tenant.kitchen.manage',
            [
                'title' => __('messages.push.kitchen_new_order_title'),
                'body' => __('messages.push.kitchen_new_order_body', [
                    'table' => $tableLabel,
                    'number' => $order->number,
                ]),
                'url' => '/cocina',
                'tag' => "kitchen-order-{$order->id}",
            ],
            $except,
        );
    }

    public function notifyWaiterItemReady(OrderItem $item, ?User $except = null): void
    {
        $item->loadMissing(['order.table', 'order.waiter']);
        $order = $item->order;
        $tableLabel = $this->tableLabel($order);

        $payload = [
            'title' => __('messages.push.waiter_item_ready_title'),
            'body' => __('messages.push.waiter_item_ready_body', [
                'item' => $item->name_snapshot,
                'table' => $tableLabel,
                'number' => $order->number,
            ]),
            'url' => "/pedidos/{$order->id}",
            'tag' => "order-item-ready-{$item->id}",
        ];

        $recipients = collect();

        if ($order->waiter instanceof User) {
            $recipients->push($order->waiter);
        }

        $recipients = $recipients
            ->merge($this->usersWithPermission('tenant.orders.take'))
            ->unique('id')
            ->reject(fn (User $user): bool => $except !== null && $user->id === $except->id);

        $this->sendToUsers($recipients, $payload);
    }

    public function notifyKitchenOrderCancelled(Order $order, ?User $except = null): void
    {
        if ($order->status !== 'cancelled') {
            return;
        }

        $tableLabel = $this->tableLabel($order);

        $this->notifyUsersWithPermission(
            'tenant.kitchen.manage',
            [
                'title' => __('messages.push.kitchen_order_cancelled_title'),
                'body' => __('messages.push.kitchen_order_cancelled_body', [
                    'table' => $tableLabel,
                    'number' => $order->number,
                ]),
                'url' => '/cocina',
                'tag' => "kitchen-cancelled-{$order->id}",
            ],
            $except,
        );
    }

    public function notifyCashierOrderToPay(Order $order, ?User $except = null): void
    {
        if ($order->status !== 'served') {
            return;
        }

        $tableLabel = $this->tableLabel($order);

        $this->notifyUsersWithPermission(
            'tenant.sales.manage',
            [
                'title' => __('messages.push.cashier_order_to_pay_title'),
                'body' => __('messages.push.cashier_order_to_pay_body', [
                    'table' => $tableLabel,
                    'number' => $order->number,
                    'total' => number_format((float) $order->total, 2),
                ]),
                'url' => '/caja',
                'tag' => "cashier-order-{$order->id}",
            ],
            $except,
        );
    }

    /**
     * @param  array{title: string, body: string, url: string, tag: string}  $payload
     */
    public function notifyNewAppReservation(array $payload): void
    {
        $this->notifyUsersWithPermission('tenant.reservations.manage', $payload);
    }

    /**
     * @param  array{title: string, body: string, url: string, tag: string}  $payload
     */
    public function notifyUsersWithPermission(
        string $permission,
        array $payload,
        ?User $except = null,
    ): void {
        $users = $this->usersWithPermission($permission);

        if ($except !== null) {
            $users = $users->reject(fn (User $user): bool => $user->id === $except->id);
        }

        $this->sendToUsers($users, $payload);
    }

    /**
     * @param  Collection<int, User>  $users
     * @param  array{title: string, body: string, url: string, tag: string}  $payload
     */
    private function sendToUsers(Collection $users, array $payload): void
    {
        $tag = $payload['tag'] ?? 'unknown';

        if (! $this->isConfigured()) {
            Log::warning('Web push omitido: VAPID no configurado', [
                'tag' => $tag,
            ]);

            return;
        }

        if ($users->isEmpty()) {
            Log::warning('Web push omitido: sin usuarios con permiso', [
                'tag' => $tag,
            ]);

            return;
        }

        $userIds = $users->pluck('id')->all();

        $subscriptions = PushSubscription::query()
            ->whereIn('user_id', $userIds)
            ->get();

        if ($subscriptions->isEmpty()) {
            Log::warning('Web push omitido: nadie del staff tiene suscripción activa', [
                'tag' => $tag,
                'user_ids' => $userIds,
                'hint' => 'El usuario debe Activar notificaciones (campana) en el panel del restaurante',
            ]);

            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => (string) config('webpush.vapid.subject'),
                'publicKey' => (string) config('webpush.vapid.public_key'),
                'privateKey' => (string) config('webpush.vapid.private_key'),
            ],
        ]);

        $json = json_encode($payload, JSON_THROW_ON_ERROR);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding,
                ]),
                $json,
            );
        }

        $sent = 0;
        $failed = 0;

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $sent++;

                continue;
            }

            $failed++;
            $endpoint = $report->getRequest()->getUri()->__toString();

            if ($report->isSubscriptionExpired()) {
                PushSubscription::query()
                    ->where('endpoint', $endpoint)
                    ->delete();
            }

            Log::warning('Web push delivery failed', [
                'tag' => $tag,
                'endpoint' => $endpoint,
                'reason' => $report->getReason(),
            ]);
        }

        Log::info('Web push enviado', [
            'tag' => $tag,
            'subscriptions' => $subscriptions->count(),
            'sent' => $sent,
            'failed' => $failed,
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    private function usersWithPermission(string $permission): Collection
    {
        try {
            return User::query()
                ->where('activo', true)
                ->permission($permission)
                ->get();
        } catch (PermissionDoesNotExist $e) {
            // Tenants viejos o cache Spatie tras cambio de schema: crear permiso faltante y reintentar.
            Log::warning('Permiso Spatie ausente al enviar web push; sincronizando catálogo tenant', [
                'permission' => $permission,
                'error' => $e->getMessage(),
            ]);

            try {
                RoleProvisioner::ensurePermissions('tenant');
                RoleProvisioner::grantCoreMissingPermissions('tenant');

                return User::query()
                    ->where('activo', true)
                    ->permission($permission)
                    ->get();
            } catch (Throwable $retry) {
                Log::warning('Web push omitido: no se pudo resolver permiso Spatie', [
                    'permission' => $permission,
                    'error' => $retry->getMessage(),
                ]);

                return collect();
            }
        }
    }

    private function tableLabel(Order $order): string
    {
        $order->loadMissing('table');

        if ($order->table === null) {
            return __('messages.push.no_table');
        }

        return __('messages.push.table_label', [
            'number' => $order->table->number,
        ]);
    }
}
