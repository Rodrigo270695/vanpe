<?php

namespace App\Support;

/**
 * Normaliza URLs de medios públicos para clientes externos (APK / web).
 * En BD se guardan rutas relativas (/storage/...), la app necesita absolutas.
 */
final class PublicMediaUrl
{
    public static function make(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $url = trim($url);
        if ($url === '') {
            return null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        if (str_starts_with($url, '//')) {
            $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';

            return $scheme.':'.$url;
        }

        return CentralUrl::to($url);
    }
}
