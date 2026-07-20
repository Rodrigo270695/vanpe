<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CfgServiceHour extends Model
{
    use HasUuids;

    public const DAYS = 7;

    protected $connection = 'tenant';

    protected $table = 'cfg_service_hours';

    protected $fillable = [
        'day_of_week',
        'opens_at',
        'closes_at',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * Siembra horario por defecto (lun–sáb 12:00–22:00, domingo cerrado).
     */
    public static function ensureDefaults(): void
    {
        for ($day = 0; $day < self::DAYS; $day++) {
            static::query()->firstOrCreate(
                ['day_of_week' => $day],
                [
                    'opens_at' => '12:00',
                    'closes_at' => $day === 5 ? '23:00' : '22:00',
                    'active' => $day !== 6,
                ],
            );
        }
    }

    /**
     * @param  list<array{day_of_week: int, opens_at: string, closes_at: string, active: bool}>  $rows
     */
    public static function syncAll(array $rows): void
    {
        foreach ($rows as $row) {
            static::query()->updateOrCreate(
                ['day_of_week' => (int) $row['day_of_week']],
                [
                    'opens_at' => $row['opens_at'],
                    'closes_at' => $row['closes_at'],
                    'active' => (bool) ($row['active'] ?? false),
                ],
            );
        }
    }
}
