<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppDiagnosticLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'device_id',
        'customer_id',
        'session_id',
        'level',
        'event',
        'message',
        'app_version',
        'platform',
        'os_version',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
