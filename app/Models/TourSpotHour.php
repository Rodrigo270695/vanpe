<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourSpotHour extends Model
{
    use HasUuids;

    public const DAYS = 7;

    protected $fillable = [
        'tour_spot_id',
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

    public function spot(): BelongsTo
    {
        return $this->belongsTo(TourSpot::class, 'tour_spot_id');
    }

    /**
     * @return list<array{day_of_week: int, opens_at: string, closes_at: string, active: bool}>
     */
    public static function defaultRows(): array
    {
        $rows = [];

        for ($day = 0; $day < self::DAYS; $day++) {
            $rows[] = [
                'day_of_week' => $day,
                'opens_at' => '09:00',
                'closes_at' => '18:00',
                'active' => $day !== 6,
            ];
        }

        return $rows;
    }

    /**
     * @param  list<array{day_of_week: int, opens_at?: string|null, closes_at?: string|null, active?: bool}>  $rows
     */
    public static function syncForSpot(TourSpot $spot, array $rows): void
    {
        foreach ($rows as $row) {
            $day = (int) $row['day_of_week'];
            $active = (bool) ($row['active'] ?? false);

            static::query()->updateOrCreate(
                [
                    'tour_spot_id' => $spot->id,
                    'day_of_week' => $day,
                ],
                [
                    'opens_at' => $active ? ($row['opens_at'] ?? '09:00') : null,
                    'closes_at' => $active ? ($row['closes_at'] ?? '18:00') : null,
                    'active' => $active,
                ],
            );
        }
    }

    /**
     * @return array{day_of_week: int, opens_at: string, closes_at: string, active: bool}
     */
    public function toAdminArray(): array
    {
        $opens = $this->opens_at;
        $closes = $this->closes_at;

        if (is_string($opens) && strlen($opens) >= 5) {
            $opens = substr($opens, 0, 5);
        }
        if (is_string($closes) && strlen($closes) >= 5) {
            $closes = substr($closes, 0, 5);
        }

        return [
            'day_of_week' => $this->day_of_week,
            'opens_at' => $opens ?: '09:00',
            'closes_at' => $closes ?: '18:00',
            'active' => $this->active,
        ];
    }
}
