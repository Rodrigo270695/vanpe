<?php

namespace App\Support\Fel;

use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\FelDocument;

/**
 * Resuelve si un comprobante se emitió en APISUNAT sandbox o producción.
 */
final class FelDocumentApisunatModeResolver
{
    /**
     * @return 'sandbox'|'produccion'|null
     */
    public static function resolve(FelDocument $document): ?string
    {
        $stored = $document->apisunat_mode;
        if (in_array($stored, ['sandbox', 'produccion'], true)) {
            return $stored;
        }

        $payload = $document->apisunat_payload;
        if (is_array($payload)) {
            $fromMeta = self::normalizeMode($payload['_vanpe_emission_mode'] ?? null);
            if ($fromMeta !== null) {
                return $fromMeta;
            }

            $apiBase = $payload['_vanpe_api_base'] ?? null;
            if (is_string($apiBase)) {
                if (str_contains(strtolower($apiBase), 'sandbox.apisunat')) {
                    return 'sandbox';
                }
                if (str_contains(strtolower($apiBase), 'app.apisunat')) {
                    return 'produccion';
                }
            }

            $fromAmbiente = self::fromPayloadTree($payload);
            if ($fromAmbiente !== null) {
                return $fromAmbiente;
            }
        }

        $haystack = self::collectHaystack($document);
        if (self::containsSandboxMarker($haystack)) {
            return 'sandbox';
        }
        if (self::containsProductionMarker($haystack)) {
            return 'produccion';
        }

        if (self::isApisunatDocument($document)) {
            return self::settingsModeFallback();
        }

        return null;
    }

    public static function isApisunatDocument(FelDocument $document): bool
    {
        if (is_array($document->apisunat_payload) && $document->apisunat_payload !== []) {
            return true;
        }

        $ref = strtolower((string) ($document->proveedor_ref ?? ''));

        return str_starts_with($ref, 'apisunat:');
    }

    /**
     * Persiste el modo inferido cuando aún no está guardado en BD.
     *
     * @return 'sandbox'|'produccion'|null
     */
    public static function resolveAndPersist(FelDocument $document): ?string
    {
        $resolved = self::resolve($document);

        if ($resolved === null || $document->apisunat_mode === $resolved) {
            return $resolved;
        }

        $document->forceFill(['apisunat_mode' => $resolved])->saveQuietly();

        return $resolved;
    }

    /**
     * @return 'sandbox'|'produccion'
     */
    private static function settingsModeFallback(): string
    {
        $settings = CfgSetting::ensureDefaults();
        $mode = $settings->apisunat_mode ?? 'sandbox';

        return in_array($mode, ['sandbox', 'produccion'], true) ? $mode : 'sandbox';
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return 'sandbox'|'produccion'|null
     */
    private static function fromPayloadTree(array $payload): ?string
    {
        $queue = [$payload];

        while ($queue !== []) {
            $node = array_shift($queue);
            if (! is_array($node)) {
                continue;
            }

            foreach ($node as $key => $value) {
                if (is_array($value)) {
                    $queue[] = $value;

                    continue;
                }

                if (! is_string($value) && ! is_numeric($value)) {
                    continue;
                }

                $keyText = strtolower((string) $key);
                if (! str_contains($keyText, 'ambiente') && ! str_contains($keyText, 'environment')) {
                    continue;
                }

                $normalized = self::normalizeMode((string) $value);
                if ($normalized !== null) {
                    return $normalized;
                }
            }
        }

        return null;
    }

    /**
     * @return 'sandbox'|'produccion'|null
     */
    private static function normalizeMode(mixed $value): ?string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $text = strtolower(trim((string) $value));

        if ($text === '') {
            return null;
        }

        if (in_array($text, ['sandbox', 'test', 'prueba', 'desarrollo', 'dev'], true)) {
            return 'sandbox';
        }

        if (in_array($text, ['produccion', 'production', 'prod', 'productivo', 'productiva'], true)) {
            return 'produccion';
        }

        return null;
    }

    private static function collectHaystack(FelDocument $document): string
    {
        $parts = [
            (string) ($document->url_pdf ?? ''),
            (string) ($document->url_xml ?? ''),
            (string) ($document->url_cdr ?? ''),
            (string) ($document->enlace_consulta ?? ''),
            (string) ($document->proveedor_ref ?? ''),
        ];

        if (is_array($document->apisunat_payload)) {
            $parts[] = json_encode($document->apisunat_payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
        }

        return strtolower(implode(' ', $parts));
    }

    private static function containsSandboxMarker(string $haystack): bool
    {
        return str_contains($haystack, 'sandbox.apisunat');
    }

    private static function containsProductionMarker(string $haystack): bool
    {
        return str_contains($haystack, 'app.apisunat');
    }
}
