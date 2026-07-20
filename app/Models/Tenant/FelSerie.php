<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FelSerie extends Model
{
    use HasUuids;

    public const TIPO_FACTURA = 1;

    public const TIPO_BOLETA = 2;

    public const AMBIENTE_SANDBOX = 'sandbox';

    public const AMBIENTE_PRODUCCION = 'produccion';

    protected $connection = 'tenant';

    protected $table = 'fel_series';

    protected $fillable = [
        'tipo_comprobante',
        'serie',
        'ambiente',
        'ultimo_correlativo',
        'activo',
        'es_predeterminada',
    ];

    protected function casts(): array
    {
        return [
            'tipo_comprobante' => 'integer',
            'ultimo_correlativo' => 'integer',
            'activo' => 'boolean',
            'es_predeterminada' => 'boolean',
        ];
    }

    public static function esTipoSunat(int $tipo): bool
    {
        return in_array($tipo, [self::TIPO_FACTURA, self::TIPO_BOLETA], true);
    }

    public static function tipoDesdeComprobante(string $comprobante): ?int
    {
        return match ($comprobante) {
            'factura' => self::TIPO_FACTURA,
            'boleta' => self::TIPO_BOLETA,
            default => null,
        };
    }

    public static function labelTipo(int $tipo): string
    {
        return match ($tipo) {
            self::TIPO_FACTURA => 'Factura',
            self::TIPO_BOLETA => 'Boleta',
            default => 'Comprobante',
        };
    }

    public static function prefijoSugerido(int $tipo): string
    {
        return match ($tipo) {
            self::TIPO_FACTURA => 'F001',
            self::TIPO_BOLETA => 'B001',
            default => '',
        };
    }

    public function esSandbox(): bool
    {
        return $this->ambiente === self::AMBIENTE_SANDBOX;
    }

    public function esProduccion(): bool
    {
        return $this->ambiente === self::AMBIENTE_PRODUCCION;
    }

    /** @return HasMany<FelDocument, $this> */
    public function documentos(): HasMany
    {
        return $this->hasMany(FelDocument::class, 'fel_serie_id');
    }
}
