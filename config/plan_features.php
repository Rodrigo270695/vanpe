<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Catálogo de features por plan
    |--------------------------------------------------------------------------
    | type: int | bool | string
    | -1 en enteros = ilimitado
    */
    'max_tables' => ['type' => 'int', 'default' => 10],
    'max_users' => ['type' => 'int', 'default' => 3],
    'max_dishes' => ['type' => 'int', 'default' => 50],
    'max_reservations_month' => ['type' => 'int', 'default' => 100],
    'max_branches' => ['type' => 'int', 'default' => 1],
    'sunat_invoicing' => ['type' => 'bool', 'default' => false],
    'kds_module' => ['type' => 'bool', 'default' => false],
    'inventory_module' => ['type' => 'bool', 'default' => false],
    'app_highlight' => ['type' => 'bool', 'default' => false],
    'advanced_reports' => ['type' => 'bool', 'default' => false],
    'support_type' => ['type' => 'string', 'default' => 'docs', 'options' => ['docs', 'email', 'whatsapp']],
];
