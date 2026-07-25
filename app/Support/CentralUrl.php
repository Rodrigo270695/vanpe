<?php

namespace App\Support;

/**
 * URLs del dominio central (plataforma), independientes del host actual.
 */
final class CentralUrl
{
    public static function origin(): string
    {
        $scheme = (string) config('tenant.scheme', 'https');
        $domains = (array) config('tenant.central_domains', []);
        $host = (string) ($domains[0] ?? parse_url((string) config('app.url'), PHP_URL_HOST) ?: 'localhost');

        $port = parse_url((string) config('app.url'), PHP_URL_PORT);
        if ($port) {
            $host .= ':'.$port;
        }

        return "{$scheme}://{$host}";
    }

    public static function to(string $path = '/'): string
    {
        return rtrim(self::origin(), '/').'/'.ltrim($path, '/');
    }
}
