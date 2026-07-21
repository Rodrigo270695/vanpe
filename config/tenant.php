<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dominios centrales (NO son tenants)
    |--------------------------------------------------------------------------
    |
    | Hosts que corresponden a la plataforma / panel administrativo y al
    | registro de restaurantes. Nunca resuelven a un tenant.
    | En dev usamos `localhost` y `127.0.0.1` (los navegadores modernos
    | resuelven cualquier *.localhost a 127.0.0.1 sin tocar el hosts file).
    |
    */

    'central_domains' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('TENANT_CENTRAL_DOMAINS', 'localhost,127.0.0.1')),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Dominio raíz de los subdominios de tenant
    |--------------------------------------------------------------------------
    |
    | Sufijo desde el cual se extrae el slug del subdominio.
    | Ejemplo: elcantaro.localhost → slug = elcantaro
    |          elcantaro.vanpe.com.pe → slug = elcantaro
    |
    */

    'root_domain' => env('TENANT_ROOT_DOMAIN', 'vanpe.pe'),

    /*
    |--------------------------------------------------------------------------
    | Prefijo obligatorio del schema del tenant
    |--------------------------------------------------------------------------
    |
    | Defensa extra: solo se aceptan schemas que empiecen con este prefijo.
    | Debe coincidir con el que genera TenantProvisioner (rst_).
    |
    */

    'schema_prefix' => env('TENANT_SCHEMA_PREFIX', 'rst_'),

    /*
    |--------------------------------------------------------------------------
    | Estados de tenant que permiten el acceso
    |--------------------------------------------------------------------------
    */

    'allowed_states' => ['active', 'trial', 'grace'],

    /*
    |--------------------------------------------------------------------------
    | Cache de resolución slug → tenant (segundos)
    |--------------------------------------------------------------------------
    |
    | 0 = sin cache (recomendado en dev). En producción 60–300.
    |
    */

    'cache_ttl' => (int) env('TENANT_CACHE_TTL', 0),

    /*
    |--------------------------------------------------------------------------
    | Construcción de URLs de subdominio
    |--------------------------------------------------------------------------
    */

    'scheme' => env('TENANT_SCHEME', env('APP_ENV') === 'production' ? 'https' : 'http'),

    'login_path' => env('TENANT_LOGIN_PATH', '/login'),

];
