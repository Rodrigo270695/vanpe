<?php

namespace App\Services\Tourist;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Valida un access token de Facebook Login (app móvil).
 *
 * Comprueba que el token pertenece a nuestra App y obtiene perfil + email.
 */
class FacebookAccessTokenVerifier
{
    /**
     * @return array{sub: string, email: string, name: string|null, picture: string|null, email_verified: bool}
     */
    public function verify(string $accessToken): array
    {
        $appId = (string) config('services.facebook.client_id');
        $appSecret = (string) config('services.facebook.client_secret');

        if ($appId === '' || $appSecret === '') {
            throw new RuntimeException('FACEBOOK_APP_ID / FACEBOOK_APP_SECRET no están configurados.');
        }

        $appToken = $appId.'|'.$appSecret;

        $debug = Http::timeout(8)
            ->acceptJson()
            ->get('https://graph.facebook.com/debug_token', [
                'input_token' => $accessToken,
                'access_token' => $appToken,
            ]);

        if (! $debug->successful()) {
            throw ValidationException::withMessages([
                'access_token' => ['El token de Facebook no es válido.'],
            ]);
        }

        /** @var array<string, mixed> $debugData */
        $debugData = $debug->json('data') ?? [];

        if (! ($debugData['is_valid'] ?? false)) {
            throw ValidationException::withMessages([
                'access_token' => ['El token de Facebook no es válido.'],
            ]);
        }

        if ((string) ($debugData['app_id'] ?? '') !== $appId) {
            throw ValidationException::withMessages([
                'access_token' => ['El token de Facebook no pertenece a esta aplicación.'],
            ]);
        }

        $profile = Http::timeout(8)
            ->acceptJson()
            ->get('https://graph.facebook.com/me', [
                'fields' => 'id,name,email,picture.type(large)',
                'access_token' => $accessToken,
            ]);

        if (! $profile->successful()) {
            throw ValidationException::withMessages([
                'access_token' => ['No se pudo obtener el perfil de Facebook.'],
            ]);
        }

        /** @var array<string, mixed> $payload */
        $payload = $profile->json() ?? [];

        $sub = (string) ($payload['id'] ?? '');
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $name = isset($payload['name']) ? (string) $payload['name'] : null;
        $picture = data_get($payload, 'picture.data.url');

        if ($sub === '') {
            throw ValidationException::withMessages([
                'access_token' => ['El token de Facebook no incluye identidad.'],
            ]);
        }

        if ($email === '') {
            throw ValidationException::withMessages([
                'access_token' => ['Facebook no compartió el correo. Concede el permiso de email e inténtalo de nuevo.'],
            ]);
        }

        return [
            'sub' => $sub,
            'email' => $email,
            'name' => $name,
            'picture' => is_string($picture) ? $picture : null,
            'email_verified' => true,
        ];
    }
}
