<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'free',
                'name' => 'Free',
                'description' => 'Aparece en VanPe y gestiona mesas y carta',
                'badge' => null,
                'monthly_price' => 0,
                'yearly_price' => null,
                'reservation_commission' => 2.00,
                'trial_days' => 0,
                'sort_order' => 1,
            ],
            [
                'code' => 'starter',
                'name' => 'Starter',
                'description' => 'Reservas ilimitadas y reportes básicos',
                'badge' => null,
                'monthly_price' => 79.00,
                'yearly_price' => 790.00,
                'reservation_commission' => 1.00,
                'trial_days' => 14,
                'sort_order' => 2,
            ],
            [
                'code' => 'pro',
                'name' => 'Pro',
                'description' => 'Facturación SUNAT, KDS de cocina y destacados',
                'badge' => 'Más popular',
                'monthly_price' => 149.00,
                'yearly_price' => 1490.00,
                'reservation_commission' => 0.50,
                'trial_days' => 14,
                'sort_order' => 3,
            ],
            [
                'code' => 'premium',
                'name' => 'Premium',
                'description' => 'Multi-sede, inventario y analítica avanzada',
                'badge' => 'Mejor valor',
                'monthly_price' => 249.00,
                'yearly_price' => 2490.00,
                'reservation_commission' => 0.00,
                'trial_days' => 7,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $data) {
            Plan::query()->updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, [
                    'active' => true,
                    'is_public' => true,
                    'color_hex' => $data['color_hex'] ?? match ($data['code']) {
                        'free' => '#94a3b8',
                        'starter' => '#4a7ab8',
                        'pro' => '#0744a9',
                        'premium' => '#2d4a73',
                        default => '#0744a9',
                    },
                ]),
            );
        }

        $this->command?->info('Planes base creados/actualizados.');
    }
}
