<?php

namespace App\Support\Fel;

final class FelReceptorResolver
{
    /**
     * @return array{tipo_doc: int, num_doc: string, nombre: string, direccion: string}
     */
    public static function datosDesdeEntrada(
        ?int $tipoDoc,
        ?string $numDoc,
        ?string $nombre,
        ?string $direccion = null,
    ): array {
        $nombreFinal = mb_substr(trim((string) ($nombre ?: 'CLIENTES VARIOS')), 0, 200);
        $digits = preg_replace('/\D+/', '', (string) $numDoc) ?? '';
        $tipo = $tipoDoc ?? 1;

        if ($digits === '') {
            return [
                'tipo_doc' => 1,
                'num_doc' => '00000000',
                'nombre' => $nombreFinal !== '' ? $nombreFinal : 'CLIENTES VARIOS',
                'direccion' => self::normalizarDireccion($direccion),
            ];
        }

        $numDocFinal = match ($tipo) {
            6 => strlen($digits) >= 11 ? substr($digits, 0, 11) : $digits,
            1 => strlen($digits) >= 8 ? substr($digits, 0, 8) : $digits,
            default => mb_substr($digits, 0, 15),
        };

        return [
            'tipo_doc' => $tipo,
            'num_doc' => $numDocFinal,
            'nombre' => $nombreFinal,
            'direccion' => self::normalizarDireccion($direccion),
        ];
    }

    public static function tipoDocSunatDesdeEtiqueta(?string $tipo): int
    {
        return match (strtoupper(trim((string) $tipo))) {
            'RUC' => 6,
            'CE' => 4,
            'PAS' => 7,
            'DNI' => 1,
            default => 1,
        };
    }

    private static function normalizarDireccion(?string $direccion): string
    {
        $value = trim((string) $direccion);

        return $value !== '' ? mb_substr($value, 0, 250) : '-';
    }
}
