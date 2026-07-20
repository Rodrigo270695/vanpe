<?php

namespace App\Services\Platform;

use App\Models\PlatformAuditLog;
use Illuminate\Support\Facades\Request;

class PlatformAuditLogger
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function record(
        string $action,
        ?string $entity = null,
        ?string $entityId = null,
        array $data = [],
        string $actorType = 'system',
        ?string $actorId = null,
        ?string $ip = null,
    ): PlatformAuditLog {
        return PlatformAuditLog::query()->create([
            'actor_type' => $actorType,
            'actor_id' => $actorId !== null ? (string) $actorId : null,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'data' => $data === [] ? null : $data,
            'ip' => $ip ?? Request::ip(),
            'created_at' => now(),
        ]);
    }
}
