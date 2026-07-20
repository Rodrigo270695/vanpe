<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CfgSetting extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'cfg_settings';

    protected $fillable = [
        'currency',
        'tax_rate',
        'prices_include_tax',
        'issues_electronic_receipts',
        'emite_comprobantes_sunat',
        'apisunat_token_enc',
        'apisunat_mode',
        'apisunat_configurado',
        'reservations_enabled',
        'reservation_duration_minutes',
        'min_booking_hours_ahead',
        'max_booking_days_ahead',
        'no_show_tolerance_minutes',
        'auto_publish',
        'daily_menu_enabled',
        'daily_menu_price',
        'daily_menu_extra_entrada_price',
        'daily_menu_includes_drink',
        'metadata',
        'singleton',
    ];

    protected function casts(): array
    {
        return [
            'tax_rate' => 'decimal:2',
            'prices_include_tax' => 'boolean',
            'issues_electronic_receipts' => 'boolean',
            'emite_comprobantes_sunat' => 'boolean',
            'apisunat_configurado' => 'boolean',
            'reservations_enabled' => 'boolean',
            'auto_publish' => 'boolean',
            'daily_menu_enabled' => 'boolean',
            'daily_menu_price' => 'decimal:2',
            'daily_menu_extra_entrada_price' => 'decimal:2',
            'daily_menu_includes_drink' => 'boolean',
            'metadata' => 'array',
            'singleton' => 'boolean',
        ];
    }

    /** Tasa total IGV+IPM para MYPE restaurante (Perú, 2026): 8% + 2,5%. */
    public const DEFAULT_RESTAURANT_TAX_RATE = 10.50;

    public static function ensureDefaults(): self
    {
        return static::query()->firstOrCreate(
            ['singleton' => true],
            [
                'currency' => 'PEN',
                'tax_rate' => self::DEFAULT_RESTAURANT_TAX_RATE,
                'prices_include_tax' => true,
                'issues_electronic_receipts' => false,
                'reservations_enabled' => true,
                'reservation_duration_minutes' => 90,
                'min_booking_hours_ahead' => 1,
                'max_booking_days_ahead' => 30,
                'no_show_tolerance_minutes' => 15,
                'auto_publish' => true,
                'daily_menu_enabled' => true,
                'daily_menu_price' => 12,
                'daily_menu_extra_entrada_price' => 5,
                'daily_menu_includes_drink' => true,
            ],
        );
    }
}
