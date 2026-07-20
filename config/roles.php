<?php

/*
|--------------------------------------------------------------------------
| Roles y permisos de VanPe
|--------------------------------------------------------------------------
| Aprovisionamiento de roles de TENANT (Spatie), por restaurante.
|
| - Los roles/permisos de la PLATAFORMA (schema public) se definen en
|   config/permissions.php y se siembran con PermissionSeeder (solo
|   superadmin como rol base; los demás los crea el propio superadmin).
| - 'tenant' → se siembra en el schema de CADA restaurante (rst_*),
|              durante el onboarding, tras crear su schema. El dueño
|              (owner) puede crear más roles y solo él los verá.
|
| El símbolo '*' otorga TODOS los permisos del scope.
*/

return [

    'tenant' => [
        // Roles sembrados en cada restaurante: no se eliminan ni renombran.
        // Solo el dueño (owner) tiene permisos bloqueados; el resto puede ajustarse.
        'protected_roles' => ['owner', 'admin', 'cajero', 'mozo', 'cocinero'],

        // Las capacidades (permisos) viven en config/permissions.php ('tenant').
        // Aquí solo definimos las PLANTILLAS de roles que se siembran en cada
        // restaurante durante el onboarding. El dueño (owner) puede crear más.
        'roles' => [
            // Dueño del restaurante: control total de SU restaurante
            'owner' => ['*'],

            // Administrador: todo lo operativo, sin tocar configuración sensible
            'admin' => [
                'tenant.users.manage',
                'tenant.menu.manage',
                'tenant.tables.manage',
                'tenant.reservations.manage',
                'tenant.orders.take',
                'tenant.kitchen.manage',
                'tenant.sales.manage',
                'tenant.invoicing.manage',
                'tenant.reports.view',
                'tenant.publication.manage',
            ],

            // Cajero: caja, ventas y facturación
            'cajero' => [
                'tenant.sales.manage',
                'tenant.invoicing.manage',
                'tenant.orders.take',
                'tenant.reservations.manage',
                'tenant.reports.view',
            ],

            // Mozo: mesas, pedidos y reservas
            'mozo' => [
                'tenant.tables.manage',
                'tenant.orders.take',
                'tenant.reservations.manage',
            ],

            // Cocinero: solo la cocina
            'cocinero' => [
                'tenant.kitchen.manage',
            ],
        ],
    ],

];
