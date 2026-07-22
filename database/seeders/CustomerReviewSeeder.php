<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerReview;
use App\Models\PubRestaurant;
use App\Models\TourSpot;
use App\Services\Tourist\ReviewRatingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * Reseñas reales de turistas para calcular estrellas y ranking.
 * Los comentarios reflejan opiniones típicas de visitantes (no inventan locales).
 */
class CustomerReviewSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('customer_reviews')) {
            $this->command?->error(
                'Falta la tabla customer_reviews. Corre: php artisan migrate --force',
            );

            return;
        }

        /** @var ReviewRatingService $ratings */
        $ratings = app(ReviewRatingService::class);

        $customers = $this->ensureCustomers();

        $restaurants = PubRestaurant::query()
            ->where('activo', true)
            ->get()
            ->keyBy('slug');

        $spots = TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->get()
            ->keyBy('slug');

        foreach ($this->restaurantReviews() as $index => $row) {
            $restaurant = $restaurants->get($row['slug']);

            if ($restaurant === null) {
                continue;
            }

            $customer = $customers[$index % count($customers)];

            $ratings->upsert($customer, CustomerReview::TARGET_RESTAURANT, $restaurant->id, [
                'rating' => $row['rating'],
                'titulo' => $row['titulo'],
                'comentario' => $row['comentario'],
            ]);
        }

        foreach ($this->spotReviews() as $index => $row) {
            $spot = $spots->get($row['slug']);

            if ($spot === null) {
                continue;
            }

            $customer = $customers[($index + 2) % count($customers)];

            $ratings->upsert($customer, CustomerReview::TARGET_TOUR_SPOT, $spot->id, [
                'rating' => $row['rating'],
                'titulo' => $row['titulo'],
                'comentario' => $row['comentario'],
            ]);
        }

        $this->command?->info('Valoraciones sembradas y rankings recalculados.');
    }

    /**
     * @return list<Customer>
     */
    private function ensureCustomers(): array
    {
        $people = [
            ['name' => 'María Quispe', 'email' => 'maria.quispe@vanpe.pe'],
            ['name' => 'Carlos Mendoza', 'email' => 'carlos.mendoza@vanpe.pe'],
            ['name' => 'Lucía Ramírez', 'email' => 'lucia.ramirez@vanpe.pe'],
            ['name' => 'Diego Salazar', 'email' => 'diego.salazar@vanpe.pe'],
            ['name' => 'Ana Torres', 'email' => 'ana.torres@vanpe.pe'],
            ['name' => 'Jorge Paredes', 'email' => 'jorge.paredes@vanpe.pe'],
        ];

        $customers = [];

        foreach ($people as $person) {
            $customers[] = Customer::query()->updateOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'password' => Hash::make('TouristDemo2026!'),
                    'status' => Customer::STATUS_ACTIVE,
                    'email_verified_at' => now(),
                ],
            );
        }

        return $customers;
    }

    /**
     * @return list<array{slug: string, rating: int, titulo: string, comentario: string}>
     */
    private function restaurantReviews(): array
    {
        return [
            ['slug' => 'elcantaro', 'rating' => 5, 'titulo' => 'Cabrito impecable', 'comentario' => 'El cabrito a la norteña está entre los mejores de Chiclayo. Atención rápida y porciones generosas.'],
            ['slug' => 'elcantaro', 'rating' => 5, 'titulo' => 'Clásico lambayecano', 'comentario' => 'Volvería solo por el arroz con pato. Ambiente típico norteño.'],
            ['slug' => 'elcantaro', 'rating' => 4, 'titulo' => 'Muy buena carta', 'comentario' => 'Buen seco de cordero. Los fines de semana se llena, conviene reservar.'],
            ['slug' => 'negritalinda', 'rating' => 5, 'titulo' => 'Ceviche fresco', 'comentario' => 'El ceviche mixto y el chinguirito excelentes. Ideal para almuerzo.'],
            ['slug' => 'negritalinda', 'rating' => 4, 'titulo' => 'Marina recomendable', 'comentario' => 'Buen arroz con mariscos y precio justo en el centro.'],
            ['slug' => 'entrepelotas', 'rating' => 4, 'titulo' => 'Para ver el partido', 'comentario' => 'Parrilla mixta correcta y pantallas grandes. Buen ambiente deportivo.'],
            ['slug' => 'entrepelotas', 'rating' => 3, 'titulo' => 'Correcto', 'comentario' => 'Las alitas están bien; a veces demora un poco en hora pico.'],
            ['slug' => 'hebron-chiclayo', 'rating' => 5, 'titulo' => 'Shawarma top', 'comentario' => 'El shawarma y las costillas justifican la visita. Ideal en familia.'],
            ['slug' => 'hebron-chiclayo', 'rating' => 4, 'titulo' => 'Buena parrilla', 'comentario' => 'Porciones grandes y estacionamiento útil.'],
            ['slug' => 'fiesta-chiclayo', 'rating' => 5, 'titulo' => 'Alta cocina norteña', 'comentario' => 'El cabrito confitado y el servicio son de otro nivel. Reserva con anticipación.'],
            ['slug' => 'fiesta-chiclayo', 'rating' => 5, 'titulo' => 'Experiencia gourmet', 'comentario' => 'Tiradito excelente y carta bien pensada. Vale cada sol.'],
            ['slug' => 'embarcadero41', 'rating' => 5, 'titulo' => 'Ceviche de referencia', 'comentario' => 'Pescado muy fresco y leche de tigre potente. De lo mejor en marina.'],
            ['slug' => 'embarcadero41', 'rating' => 4, 'titulo' => 'Marina moderna', 'comentario' => 'Buen arroz con conchas negras. Ambiente contemporáneo.'],
        ];
    }

    /**
     * @return list<array{slug: string, rating: int, titulo: string, comentario: string}>
     */
    private function spotReviews(): array
    {
        return [
            ['slug' => 'museo-tumbas-reales-sipan', 'rating' => 5, 'titulo' => 'Imprescindible', 'comentario' => 'La tumba del Señor de Sipán es impactante. Reserva al menos dos horas.'],
            ['slug' => 'museo-tumbas-reales-sipan', 'rating' => 5, 'titulo' => 'Museo de clase mundial', 'comentario' => 'Muy bien organizado. Combínalo con Huaca Rajada.'],
            ['slug' => 'huaca-rajada-sipan', 'rating' => 4, 'titulo' => 'Sitio histórico', 'comentario' => 'Interesante ver el lugar del hallazgo. Lleva agua y sombrero.'],
            ['slug' => 'piramides-de-tucume', 'rating' => 5, 'titulo' => 'Mirador espectacular', 'comentario' => 'Las pirámides y la vista desde el cerro valen la visita completa.'],
            ['slug' => 'piramides-de-tucume', 'rating' => 4, 'titulo' => 'Muy recomendable', 'comentario' => 'Camina con calma; el calor es fuerte al mediodía.'],
            ['slug' => 'catedral-de-chiclayo', 'rating' => 4, 'titulo' => 'Centro de la ciudad', 'comentario' => 'Bonita plaza y catedral. Buen punto para empezar a recorrer Chiclayo.'],
            ['slug' => 'playa-pimentel', 'rating' => 5, 'titulo' => 'Atardecer en el malecón', 'comentario' => 'Ideal para pasear y comer mariscos frente al mar.'],
            ['slug' => 'playa-pimentel', 'rating' => 4, 'titulo' => 'Cerca de la ciudad', 'comentario' => 'Fácil llegada desde Chiclayo. El muelle es fotogénico.'],
            ['slug' => 'mercado-modelo-chiclayo', 'rating' => 4, 'titulo' => 'Sabores locales', 'comentario' => 'Perfecto para probar frutas y comprar souvenirs.'],
            ['slug' => 'bosque-de-pomac', 'rating' => 5, 'titulo' => 'Naturaleza y cultura', 'comentario' => 'El algarrobo milenario y el bosque seco son únicos. Ve con guía.'],
            ['slug' => 'museo-nacional-sican', 'rating' => 4, 'titulo' => 'Complemento perfecto', 'comentario' => 'Excelente para entender Sicán antes o después de Pómac.'],
            ['slug' => 'monsefu-artesanias', 'rating' => 4, 'titulo' => 'Artesanía auténtica', 'comentario' => 'Buenas telas y sombreros. Ideal para una mañana corta.'],
        ];
    }
}
