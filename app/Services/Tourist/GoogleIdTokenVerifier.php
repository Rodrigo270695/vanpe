<?php

namespace App\Services\Tourist;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Valida un ID token de Google Sign-In (app móvil).
 *
 * Comprueba aud (Client IDs permitidos), expiración, email_verified y sub.
 */
class GoogleIdTokenVerifier
{
    /**
     * @return array{sub: string, email: string, name: string|null, picture: string|null, email_verified: bool}
     */
    public function verify(string $idToken): array
    {
        $allowedAudiences = config('tourist.google_client_ids', []);

        if ($allowedAudiences === []) {
            throw new RuntimeException('TOURIST_GOOGLE_CLIENT_IDS no está configurado.');
        }

        $response = Http::timeout(8)
            ->acceptJson()
            ->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'id_token' => ['El token de Google no es válido.'],
            ]);
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json() ?? [];

        $aud = (string) ($payload['aud'] ?? '');
        $exp = (int) ($payload['exp'] ?? 0);
        $sub = (string) ($payload['sub'] ?? '');
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($sub === '' || $email === '') {
            throw ValidationException::withMessages([
                'id_token' => ['El token de Google no incluye identidad completa.'],
            ]);
        }

        if (! in_array($aud, $allowedAudiences, true)) {
            throw ValidationException::withMessages([
                'id_token' => ['El Client ID de Google no está autorizado.'],
            ]);
        }

        if ($exp > 0 && $exp < time()) {
            throw ValidationException::withMessages([
                'id_token' => ['El token de Google ha expirado.'],
            ]);
        }

        if (! $emailVerified) {
            throw ValidationException::withMessages([
                'id_token' => ['El correo de Google no está verificado.'],
            ]);
        }

        return [
            'sub' => $sub,
            'email' => $email,
            'name' => isset($payload['name']) ? (string) $payload['name'] : null,
            'picture' => isset($payload['picture']) ? (string) $payload['picture'] : null,
            'email_verified' => true,
        ];
    }
}
