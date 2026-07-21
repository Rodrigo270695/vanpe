<?php

/*
|--------------------------------------------------------------------------
| Catálogo de permisos por scope
|--------------------------------------------------------------------------
| Define QUÉ se puede hacer (capacidades) en cada ámbito:
|
|  - 'platform' → schema public. Lo administra el superadmin.
|  - 'tenant'   → schema de cada restaurante (rst_*). El dueño (owner)
|                 reparte estos permisos entre SU personal.
|
| El orden de los módulos es el que se muestra en el modal de permisos.
|
| 'core_roles' son roles del sistema: no se editan/eliminan ni se les
| cambian los permisos desde la UI (el owner/superadmin ya tiene todo).
*/

return [

    'platform' => [
        'core_roles' => ['superadmin'],
        'modules' => [
            'dashboard' => [
                'label' => 'Dashboard',
                'permissions' => [
                    'dashboard.view' => 'Ver el panel principal',
                ],
            ],
            'tenants' => [
                'label' => 'Restaurantes',
                'permissions' => [
                    'tenants.view' => 'Ver restaurantes',
                    'tenants.create' => 'Registrar restaurantes',
                    'tenants.update' => 'Editar restaurantes',
                    'tenants.delete' => 'Eliminar restaurantes',
                ],
            ],
            'plans' => [
                'label' => 'Planes',
                'permissions' => [
                    'plans.view' => 'Ver planes',
                    'plans.create' => 'Crear planes',
                    'plans.update' => 'Editar planes',
                    'plans.delete' => 'Eliminar planes',
                ],
            ],
            'plan_features' => [
                'label' => 'Features de plan',
                'permissions' => [
                    'plan_features.view' => 'Ver features de plan',
                    'plan_features.create' => 'Crear features de plan',
                    'plan_features.update' => 'Editar features de plan',
                    'plan_features.delete' => 'Eliminar features de plan',
                ],
            ],
            'subscriptions' => [
                'label' => 'Suscripciones',
                'permissions' => [
                    'subscriptions.view' => 'Ver suscripciones',
                    'subscriptions.create' => 'Crear suscripciones',
                    'subscriptions.update' => 'Editar suscripciones',
                    'subscriptions.delete' => 'Eliminar suscripciones',
                ],
            ],
            'subscription_payments' => [
                'label' => 'Pagos de suscripción',
                'permissions' => [
                    'subscription_payments.view' => 'Ver pagos de suscripción',
                    'subscription_payments.create' => 'Registrar pagos de suscripción',
                    'subscription_payments.update' => 'Editar pagos de suscripción',
                    'subscription_payments.delete' => 'Eliminar pagos de suscripción',
                ],
            ],
            'promo_codes' => [
                'label' => 'Códigos promocionales',
                'permissions' => [
                    'promo_codes.view' => 'Ver códigos promocionales',
                    'promo_codes.create' => 'Crear códigos promocionales',
                    'promo_codes.update' => 'Editar códigos promocionales',
                    'promo_codes.delete' => 'Eliminar códigos promocionales',
                ],
            ],
            'catalog' => [
                'label' => 'Catálogo turístico',
                'permissions' => [
                    'catalog.view' => 'Ver catálogo turístico',
                    'catalog.create' => 'Crear ítems del catálogo',
                    'catalog.update' => 'Editar ítems del catálogo',
                    'catalog.delete' => 'Eliminar ítems del catálogo',
                    'catalog.proposals' => 'Aprobar o rechazar propuestas',
                ],
            ],
            'tour_spots' => [
                'label' => 'Centros turísticos',
                'permissions' => [
                    'tour_spots.view' => 'Ver centros turísticos',
                    'tour_spots.create' => 'Crear centros turísticos',
                    'tour_spots.update' => 'Editar centros turísticos',
                    'tour_spots.publish' => 'Publicar centros turísticos',
                    'tour_spots.delete' => 'Eliminar centros turísticos',
                ],
            ],
            'users' => [
                'label' => 'Usuarios',
                'permissions' => [
                    'users.view' => 'Ver usuarios',
                    'users.create' => 'Crear usuarios',
                    'users.update' => 'Editar usuarios',
                    'users.delete' => 'Eliminar usuarios',
                    'users.roles' => 'Asignar roles a usuarios',
                ],
            ],
            'roles' => [
                'label' => 'Roles',
                'permissions' => [
                    'roles.view' => 'Ver roles',
                    'roles.create' => 'Crear roles',
                    'roles.update' => 'Editar roles',
                    'roles.delete' => 'Eliminar roles',
                    'roles.permissions' => 'Gestionar permisos de un rol',
                ],
            ],
        ],
    ],

    'tenant' => [
        'core_roles' => ['owner'],
        'manage_ability' => 'tenant.users.manage',
        'modules' => [
            'operacion' => [
                'label' => 'Operación del local',
                'permissions' => [
                    'tenant.tables.manage' => 'Mesas y zonas',
                    'tenant.reservations.manage' => 'Reservas y lista de espera',
                    'tenant.orders.take' => 'Pedidos (salón)',
                    'tenant.kitchen.manage' => 'Cocina y comandas',
                ],
            ],
            'carta' => [
                'label' => 'Carta',
                'permissions' => [
                    'tenant.menu.manage' => 'Carta y platos',
                ],
            ],
            'ventas' => [
                'label' => 'Ventas y caja',
                'permissions' => [
                    'tenant.sales.manage' => 'Caja y ventas',
                    'tenant.invoicing.manage' => 'Facturación electrónica (SUNAT)',
                ],
            ],
            'informes' => [
                'label' => 'Informes',
                'permissions' => [
                    'tenant.reports.view' => 'Reportes de ventas',
                ],
            ],
            'negocio' => [
                'label' => 'Negocio y publicación',
                'permissions' => [
                    'tenant.settings.manage' => 'Configuración del negocio',
                    'tenant.publication.manage' => 'Publicación en la app del turista',
                ],
            ],
            'personal' => [
                'label' => 'Personal',
                'permissions' => [
                    'tenant.users.manage' => 'Usuarios y roles del restaurante',
                ],
            ],
        ],
    ],

];
