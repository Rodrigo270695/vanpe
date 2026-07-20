<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use RuntimeException;

final class ApiPeruRucService
{
    /**
     * @return array{ruc: string, razon_social: string, direccion: string|null}
     */
    public function consultar(string $ruc): array
    {
        $token = trim((string) config('services.apiperu.token', ''));
        $base = rtrim((string) config('services.apiperu.base_url', 'https://apiperu.dev/api'), '/');

        if ($token === '') {
            throw new RuntimeException(__('messages.fel.ruc_lookup_unavailable'));
        }

        $response = Http::timeout(25)
            ->acceptJson()
            ->withToken($token)
            ->post($base.'/ruc', ['ruc' => $ruc]);

        if (! $response->successful()) {
            throw new RuntimeException(__('messages.fel.ruc_lookup_failed'));
        }

        $json = $response->json();
        if (! is_array($json) || ! ($json['success'] ?? false)) {
            throw new RuntimeException(
                is_string($json['message'] ?? null)
                    ? $json['message']
                    : __('messages.fel.ruc_not_found'),
            );
        }

        $data = $json['data'] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException(__('messages.fel.ruc_not_found'));
        }

        $razon = (string) ($data['nombre_o_razon_social'] ?? '');
        if ($razon === '') {
            throw new RuntimeException(__('messages.fel.ruc_not_found'));
        }

        $direccion = $data['direccion_completa'] ?? $data['direccion'] ?? null;

        return [
            'ruc' => $ruc,
            'razon_social' => mb_substr($razon, 0, 255),
            'direccion' => is_string($direccion) && $direccion !== '' ? $direccion : null,
        ];
    }
}
