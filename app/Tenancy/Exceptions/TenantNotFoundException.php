<?php

namespace App\Tenancy\Exceptions;

use RuntimeException;

class TenantNotFoundException extends RuntimeException
{
    public function __construct(public readonly string $identifier)
    {
        parent::__construct("No existe un restaurante para el subdominio «{$identifier}».");
    }
}
