<?php

namespace App\Tenancy\Exceptions;

use App\Models\Tenant;
use RuntimeException;

class TenantUnavailableException extends RuntimeException
{
    public function __construct(public readonly Tenant $tenant)
    {
        parent::__construct("El restaurante «{$tenant->slug}» no está disponible (estado: {$tenant->estado}).");
    }
}
