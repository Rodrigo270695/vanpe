<?php

namespace Database\Seeders;

use App\Models\Distrito;
use App\Models\Provincia;
use App\Models\RefCatalogItem;
use App\Models\Tenant;
use App\Models\Tenant\CfgCatalogSelection;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\MenuCategory;
use App\Models\Tenant\MenuDish;
use App\Services\Platform\PublicCatalogSync;
use App\Services\Tenant\TenantProvisioner;
use App\Support\RefCatalogTypes;
use Illuminate\Database\Seeder;

/**
 * Restaurantes reales de Chiclayo/Lambayeque con platos típicos y sync al catálogo público.
 */
class RestaurantContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(LambayequeGeoSeeder::class);

        $geo = $this->resolveChiclayoGeo();

        if ($geo === null) {
            $this->command?->error('No se encontró el distrito Chiclayo tras sembrar ubigeo de Lambayeque.');

            return;
        }

        /** @var TenantProvisioner $provisioner */
        $provisioner = app(TenantProvisioner::class);
        /** @var PublicCatalogSync $sync */
        $sync = app(PublicCatalogSync::class);

        foreach ($this->restaurants() as $def) {
            $tenant = Tenant::withTrashed()->where('slug', $def['slug'])->first();

            if ($tenant !== null && $tenant->trashed()) {
                $tenant->restore();
            }

            if ($tenant === null) {
                $tenant = $provisioner->provision([
                    'slug' => $def['slug'],
                    'razon_social' => $def['razon_social'],
                    'nombre_comercial' => $def['nombre'],
                    'email_admin' => $def['email_admin'],
                    'ruc' => $def['ruc'] ?? null,
                    'telefono' => $def['telefono'] ?? null,
                    'departamento_id' => $geo['departamento_id'],
                    'provincia_id' => $geo['provincia_id'],
                    'distrito_id' => $geo['distrito_id'],
                    'owner' => [
                        'name' => $def['owner_name'],
                        'email' => $def['owner_email'],
                        'password' => 'VanpeDemo2026!',
                        'email_verified_at' => now(),
                    ],
                ]);
            }

            $tenant->update([
                'nombre_comercial' => $def['nombre'],
                'razon_social' => $def['razon_social'],
                'telefono' => $def['telefono'] ?? $tenant->telefono,
                'direccion' => $def['direccion'],
                'departamento_id' => $geo['departamento_id'],
                'provincia_id' => $geo['provincia_id'],
                'distrito_id' => $geo['distrito_id'],
                'latitud' => $def['latitud'],
                'longitud' => $def['longitud'],
                'publicado' => true,
                'estado' => in_array($tenant->estado, ['suspended', 'cancelled'], true) ? 'active' : $tenant->estado,
                'onboarding_completado' => true,
            ]);

            $provisioner->bindSchema($tenant);

            $settings = CfgSetting::ensureDefaults();
            $settings->update([
                'reservations_enabled' => true,
            ]);

            $this->syncCatalogTags($def['cuisine_slugs'] ?? [], $def['service_slugs'] ?? []);
            $this->seedDishes($def['dishes'] ?? []);

            $sync->syncAll($tenant);

            $tenant->pubRestaurant?->update([
                'descripcion' => $def['descripcion'],
                'whatsapp' => $def['whatsapp'] ?? $def['telefono'] ?? null,
                'rango_precio' => $def['rango_precio'] ?? 2,
                'destacado' => $def['destacado'] ?? false,
                'activo' => true,
            ]);

            $this->command?->info("Restaurante listo: {$def['nombre']} ({$def['slug']})");
        }
    }

    /**
     * @return array{departamento_id: int, provincia_id: int, distrito_id: int}|null
     */
    private function resolveChiclayoGeo(): ?array
    {
        $distrito = Distrito::query()
            ->with('provincia')
            ->where('name', 'ilike', 'CHICLAYO')
            ->whereHas('provincia', fn ($q) => $q->where('name', 'ilike', 'CHICLAYO'))
            ->first();

        if ($distrito === null) {
            $distrito = Distrito::query()
                ->with('provincia')
                ->where('name', 'ilike', 'CHICLAYO')
                ->first();
        }

        if ($distrito === null || $distrito->provincia === null) {
            return null;
        }

        /** @var Provincia $provincia */
        $provincia = $distrito->provincia;

        return [
            'departamento_id' => (int) $provincia->departamento_id,
            'provincia_id' => (int) $provincia->id,
            'distrito_id' => (int) $distrito->id,
        ];
    }

    /**
     * @param  list<string>  $cuisineSlugs
     * @param  list<string>  $serviceSlugs
     */
    private function syncCatalogTags(array $cuisineSlugs, array $serviceSlugs): void
    {
        $items = RefCatalogItem::query()
            ->where(function ($q) use ($cuisineSlugs, $serviceSlugs): void {
                $q->where(function ($inner) use ($cuisineSlugs): void {
                    $inner->where('type', RefCatalogTypes::CUISINE)
                        ->whereIn('slug', $cuisineSlugs);
                })->orWhere(function ($inner) use ($serviceSlugs): void {
                    $inner->where('type', RefCatalogTypes::SERVICE)
                        ->whereIn('slug', $serviceSlugs);
                });
            })
            ->get(['id', 'type']);

        $typesById = $items->mapWithKeys(
            fn (RefCatalogItem $item): array => [$item->id => $item->type],
        )->all();

        CfgCatalogSelection::syncIds($items->pluck('id')->all(), $typesById);
    }

    /**
     * @param  list<array{name: string, description?: string, price: float|int, category?: string, featured?: bool}>  $dishes
     */
    private function seedDishes(array $dishes): void
    {
        $categories = MenuCategory::query()
            ->get()
            ->keyBy('system_key');

        foreach ($dishes as $index => $dish) {
            $systemKey = $dish['category'] ?? 'carta';
            $category = $categories->get($systemKey) ?? $categories->get('carta');

            if ($category === null) {
                continue;
            }

            MenuDish::query()->updateOrCreate(
                [
                    'category_id' => $category->id,
                    'name' => $dish['name'],
                ],
                [
                    'type' => 'simple',
                    'description' => $dish['description'] ?? null,
                    'price' => $dish['price'],
                    'available' => true,
                    'publish_in_app' => true,
                    'featured' => (bool) ($dish['featured'] ?? false),
                    'sort_order' => $index + 1,
                    'is_drink' => $systemKey === 'bebida',
                ],
            );
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function restaurants(): array
    {
        return [
            [
                'slug' => 'elcantaro',
                'nombre' => 'El Cántaro',
                'razon_social' => 'El Cántaro Restaurante E.I.R.L.',
                'email_admin' => 'admin@elcantaro.pe',
                'owner_name' => 'Administración El Cántaro',
                'owner_email' => 'owner@elcantaro.pe',
                'telefono' => '+51 74 270145',
                'whatsapp' => '+51 974270145',
                'direccion' => 'Calle Dos de Mayo 115, Chiclayo',
                'latitud' => -6.7739,
                'longitud' => -79.8378,
                'descripcion' => 'Restaurante chiclayano referente de la cocina norteña: cabrito, seco de cordero, arroz con pato y tradicionalismos de Lambayeque.',
                'rango_precio' => 2,
                'destacado' => true,
                'cuisine_slugs' => ['criollo'],
                'service_slugs' => ['wifi-gratis', 'estacionamiento', 'pago-con-tarjeta', 'yape-plin', 'reservas-en-linea'],
                'dishes' => [
                    ['name' => 'Cabrito a la norteña', 'description' => 'Cabrito tierno con yuca y arroz.', 'price' => 38, 'featured' => true],
                    ['name' => 'Arroz con pato', 'description' => 'Clásico lambayecano con cilantro y ají.', 'price' => 36, 'featured' => true],
                    ['name' => 'Seco de cordero', 'description' => 'Seco aromático acompañado de frejoles.', 'price' => 35],
                    ['name' => 'Ceviche de pescado', 'description' => 'Pescado fresco del día al estilo norteño.', 'price' => 32, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Chicha de jora', 'description' => 'Bebida fermentada tradicional.', 'price' => 8, 'category' => 'bebida'],
                    ['name' => 'King Kong de manjar', 'description' => 'Dulce típico de Lambayeque.', 'price' => 12],
                ],
            ],
            [
                'slug' => 'negritalinda',
                'nombre' => 'Negrita Linda',
                'razon_social' => 'Negrita Linda S.A.C.',
                'email_admin' => 'admin@negritalinda.pe',
                'owner_name' => 'Administración Negrita Linda',
                'owner_email' => 'owner@negritalinda.pe',
                'telefono' => '+51 74 206718',
                'direccion' => 'Av. Balta 200, Chiclayo',
                'latitud' => -6.7695,
                'longitud' => -79.8401,
                'descripcion' => 'Cocina criolla y marina en ambiente familiar, conocida por sus ceviches, causas y platos de fondo norteños.',
                'rango_precio' => 2,
                'destacado' => true,
                'cuisine_slugs' => ['criollo', 'cebicheria', 'mariscos'],
                'service_slugs' => ['wifi-gratis', 'para-llevar', 'yape-plin', 'pago-con-tarjeta'],
                'dishes' => [
                    ['name' => 'Ceviche mixto', 'description' => 'Pescado, mariscos y leche de tigre.', 'price' => 34, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Chinguirito', 'description' => 'Clásico de caballa seca deshilachada.', 'price' => 28, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Sudado de pescado', 'description' => 'Pescado al vapor en fondo norteño.', 'price' => 33],
                    ['name' => 'Arroz con mariscos', 'description' => 'Arroz jugoso con mariscos frescos.', 'price' => 37, 'featured' => true],
                    ['name' => 'Chicha morada', 'description' => 'Jarra para compartir.', 'price' => 10, 'category' => 'bebida'],
                ],
            ],
            [
                'slug' => 'entrepelotas',
                'nombre' => 'Entre Pelotas',
                'razon_social' => 'Entre Pelotas Restaurante S.A.C.',
                'email_admin' => 'admin@entrepelotas.pe',
                'owner_name' => 'Administración Entre Pelotas',
                'owner_email' => 'owner@entrepelotas.pe',
                'telefono' => '+51 74 221500',
                'direccion' => 'Calle Elías Aguirre 650, Chiclayo',
                'latitud' => -6.7719,
                'longitud' => -79.8432,
                'descripcion' => 'Restaurante-bar deportivo chiclayano con parrillas, alitas, hamburguesas y pantallas para ver partidos.',
                'rango_precio' => 2,
                'destacado' => false,
                'cuisine_slugs' => ['parrilla', 'comida-rapida'],
                'service_slugs' => ['wifi-gratis', 'terraza', 'musica-en-vivo', 'yape-plin', 'pago-con-tarjeta'],
                'dishes' => [
                    ['name' => 'Parrilla mixta', 'description' => 'Carne, pollo y chorizo a la brasa.', 'price' => 45, 'featured' => true],
                    ['name' => 'Alitas BBQ', 'description' => 'Porción de alitas con salsa BBQ.', 'price' => 28, 'featured' => true],
                    ['name' => 'Hamburguesa clásica', 'description' => 'Carne, queso, papas fritas.', 'price' => 24],
                    ['name' => 'Papas nachos', 'description' => 'Papas con queso y guacamole.', 'price' => 18, 'category' => 'entrada'],
                    ['name' => 'Cerveza artesanal', 'description' => 'Cerveza local de barril.', 'price' => 14, 'category' => 'bebida'],
                ],
            ],
            [
                'slug' => 'hebron-chiclayo',
                'nombre' => 'Hebrón',
                'razon_social' => 'Hebrón Chiclayo S.A.C.',
                'email_admin' => 'admin@hebronchiclayo.pe',
                'owner_name' => 'Administración Hebrón',
                'owner_email' => 'owner@hebronchiclayo.pe',
                'ruc' => '20601234567',
                'telefono' => '+51 74 227070',
                'direccion' => 'Av. Salaverry 620, Chiclayo',
                'latitud' => -6.7672,
                'longitud' => -79.8458,
                'descripcion' => 'Cadena reconocida de parrillas y cocina árabe-peruana en Chiclayo: shawarma, costillas y buffets familiares.',
                'rango_precio' => 2,
                'destacado' => true,
                'cuisine_slugs' => ['parrilla', 'fusion'],
                'service_slugs' => ['wifi-gratis', 'estacionamiento', 'zona-para-ninos', 'pago-con-tarjeta', 'yape-plin', 'delivery'],
                'dishes' => [
                    ['name' => 'Shawarma de pollo', 'description' => 'En pan árabe con salsas de la casa.', 'price' => 26, 'featured' => true],
                    ['name' => 'Costillas BBQ', 'description' => 'Costillas glaseadas a la parrilla.', 'price' => 48, 'featured' => true],
                    ['name' => 'Brochetas mixtas', 'description' => 'Pollo y carne con arroz árabe.', 'price' => 39],
                    ['name' => 'Hummus con pan', 'description' => 'Entrada mediterránea.', 'price' => 18, 'category' => 'entrada'],
                    ['name' => 'Limonada hierbabuena', 'description' => 'Jarra fresca.', 'price' => 12, 'category' => 'bebida'],
                ],
            ],
            [
                'slug' => 'fiesta-chiclayo',
                'nombre' => 'Fiesta Gourmet',
                'razon_social' => 'Fiesta Restaurante S.A.C.',
                'email_admin' => 'admin@fiestachiclayo.pe',
                'owner_name' => 'Administración Fiesta',
                'owner_email' => 'owner@fiestachiclayo.pe',
                'ruc' => '20481234567',
                'telefono' => '+51 74 201970',
                'direccion' => 'Av. Salaverry 1820, Urb. Santa Victoria, Chiclayo',
                'latitud' => -6.7598,
                'longitud' => -79.8495,
                'descripcion' => 'Restaurante gourmet de cocina norteña contemporánea, referente gastronómico de Chiclayo con platos de autor inspirados en Lambayeque.',
                'rango_precio' => 3,
                'destacado' => true,
                'cuisine_slugs' => ['criollo', 'fusion'],
                'service_slugs' => ['wifi-gratis', 'estacionamiento', 'reservas-en-linea', 'pago-con-tarjeta', 'aire-acondicionado'],
                'dishes' => [
                    ['name' => 'Cabrito confitado', 'description' => 'Versión gourmet del cabrito norteño.', 'price' => 68, 'featured' => true],
                    ['name' => 'Arroz con pato de autor', 'description' => 'Reinterpretación del clásico lambayecano.', 'price' => 62, 'featured' => true],
                    ['name' => 'Tiradito de pescado', 'description' => 'Corte fino con ají limo y cítricos.', 'price' => 42, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Frejolada norteña', 'description' => 'Frejoles con seco y arroz.', 'price' => 48],
                    ['name' => 'Maridaje de chicha', 'description' => 'Copa de chicha de jora de la casa.', 'price' => 16, 'category' => 'bebida'],
                ],
            ],
            [
                'slug' => 'embarcadero41',
                'nombre' => 'Embarcadero 41',
                'razon_social' => 'Embarcadero 41 S.A.C.',
                'email_admin' => 'admin@embarcadero41.pe',
                'owner_name' => 'Administración Embarcadero 41',
                'owner_email' => 'owner@embarcadero41.pe',
                'ruc' => '20609876543',
                'telefono' => '+51 74 232041',
                'direccion' => 'Calle Elías Aguirre 830, Chiclayo',
                'latitud' => -6.7728,
                'longitud' => -79.8441,
                'descripcion' => 'Cevichería moderna con pescados y mariscos del día, parte de la propuesta marina contemporánea presente en Chiclayo.',
                'rango_precio' => 3,
                'destacado' => true,
                'cuisine_slugs' => ['cebicheria', 'mariscos'],
                'service_slugs' => ['wifi-gratis', 'reservas-en-linea', 'pago-con-tarjeta', 'yape-plin', 'aire-acondicionado'],
                'dishes' => [
                    ['name' => 'Ceviche clásico', 'description' => 'Pescado fresco, limón, cebolla y ají limo.', 'price' => 42, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Leche de tigre', 'description' => 'Elaborada al momento.', 'price' => 22, 'category' => 'entrada', 'featured' => true],
                    ['name' => 'Arroz con conchas negras', 'description' => 'Clásico norteño de conchas.', 'price' => 55, 'featured' => true],
                    ['name' => 'Chupe de camarones', 'description' => 'Sopa cremosa de camarones.', 'price' => 48],
                    ['name' => 'Chilcano de pisco', 'description' => 'Cóctel clásico.', 'price' => 18, 'category' => 'bebida'],
                ],
            ],
        ];
    }
}
