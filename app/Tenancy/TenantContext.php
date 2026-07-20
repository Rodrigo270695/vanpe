<?php

namespace App\Tenancy;

use App\Models\Tenant;

/**
 * Contexto inmutable del tenant resuelto para la petición actual.
 */
class TenantContext
{
    public function __construct(
        public readonly Tenant $tenant,
        public readonly string $schema,
        public readonly string $slug,
    ) {}

    public function id(): string
    {
        return (string) $this->tenant->getKey();
    }
}
