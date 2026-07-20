<?php

namespace App\Support\Fel;

use App\Models\Tenant\CfgSetting;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;
use Throwable;

final class ApisunatCredentialResolver
{
    /**
     * @return array{token: string, mode: 'sandbox'|'produccion'}
     */
    public static function fromSettings(CfgSetting $settings): array
    {
        if (! self::estaConfigurado($settings)) {
            throw new RuntimeException(__('messages.fel.apisunat_not_configured'));
        }

        try {
            $token = Crypt::decryptString((string) $settings->apisunat_token_enc);
        } catch (Throwable) {
            throw new RuntimeException(__('messages.fel.apisunat_token_invalid'));
        }

        $mode = in_array($settings->apisunat_mode, ['sandbox', 'produccion'], true)
            ? $settings->apisunat_mode
            : 'sandbox';

        return [
            'token' => $token,
            'mode' => $mode,
        ];
    }

    public static function estaConfigurado(CfgSetting $settings): bool
    {
        return (bool) $settings->emite_comprobantes_sunat
            && (bool) $settings->apisunat_configurado
            && filled($settings->apisunat_token_enc);
    }
}
