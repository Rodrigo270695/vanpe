<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformAuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'actor_type',
        'actor_id',
        'action',
        'entity',
        'entity_id',
        'data',
        'ip',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
