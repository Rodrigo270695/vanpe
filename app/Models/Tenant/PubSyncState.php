<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PubSyncState extends Model
{
    use HasUuids;

    public const STATUS_PENDING = 'pending';

    public const STATUS_SYNCED = 'synced';

    public const STATUS_ERROR = 'error';

    /** @var list<string> */
    public const ENTITIES = [
        'ficha',
        'galeria',
        'horarios',
        'catalogo',
        'carta',
        'disponibilidad',
    ];

    protected $connection = 'tenant';

    protected $table = 'pub_sync_state';

    protected $fillable = [
        'entity',
        'synced_at',
        'payload_hash',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'synced_at' => 'datetime',
        ];
    }

    public static function markSynced(string $entity, string $hash): void
    {
        static::query()->updateOrCreate(
            ['entity' => $entity],
            [
                'synced_at' => now(),
                'payload_hash' => $hash,
                'status' => self::STATUS_SYNCED,
                'error_message' => null,
            ],
        );
    }

    public static function markPending(string $entity): void
    {
        static::query()->updateOrCreate(
            ['entity' => $entity],
            [
                'status' => self::STATUS_PENDING,
                'error_message' => null,
            ],
        );
    }

    public static function markError(string $entity, string $message): void
    {
        static::query()->updateOrCreate(
            ['entity' => $entity],
            [
                'status' => self::STATUS_ERROR,
                'error_message' => $message,
            ],
        );
    }
}
