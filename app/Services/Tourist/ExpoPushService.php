<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\CustomerPushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Envía notificaciones push a la app turista vía Expo Push API. */
class ExpoPushService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * @param  array{title: string, body: string, data?: array<string, mixed>}  $payload
     */
    public function notifyCustomer(Customer $customer, array $payload): void
    {
        $tokens = CustomerPushToken::query()
            ->where('customer_id', $customer->id)
            ->pluck('token')
            ->filter(fn (string $token): bool => str_starts_with($token, 'ExponentPushToken[')
                || str_starts_with($token, 'ExpoPushToken['))
            ->values()
            ->all();

        if ($tokens === []) {
            return;
        }

        $messages = array_map(fn (string $token): array => [
            'to' => $token,
            'sound' => 'default',
            'title' => $payload['title'],
            'body' => $payload['body'],
            'data' => $payload['data'] ?? [],
        ], $tokens);

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(8)
                ->post(self::ENDPOINT, $messages);

            if (! $response->successful()) {
                Log::warning('Expo push HTTP error', [
                    'customer_id' => $customer->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return;
            }

            $data = $response->json('data');
            if (! is_array($data)) {
                return;
            }

            foreach ($data as $index => $ticket) {
                if (! is_array($ticket) || ($ticket['status'] ?? null) !== 'error') {
                    continue;
                }

                $token = $tokens[$index] ?? null;
                $details = $ticket['details']['error'] ?? null;

                if ($token !== null && in_array($details, ['DeviceNotRegistered', 'InvalidCredentials'], true)) {
                    CustomerPushToken::query()->where('token', $token)->delete();
                }
            }
        } catch (Throwable $e) {
            Log::warning('Expo push failed', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
