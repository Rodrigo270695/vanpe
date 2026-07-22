<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\CustomerReview;
use App\Models\PubRestaurant;
use App\Models\TourSpot;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReviewRatingService
{
    /**
     * @param  array{rating: int, titulo?: string|null, comentario?: string|null}  $data
     */
    public function upsert(
        Customer $customer,
        string $targetType,
        string $targetId,
        array $data,
    ): CustomerReview {
        $this->assertTargetExists($targetType, $targetId);

        return DB::transaction(function () use ($customer, $targetType, $targetId, $data): CustomerReview {
            $review = CustomerReview::query()->updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                ],
                [
                    'rating' => (int) $data['rating'],
                    'titulo' => $data['titulo'] ?? null,
                    'comentario' => $data['comentario'] ?? null,
                ],
            );

            $this->recalculate($targetType, $targetId);

            return $review->fresh(['customer:id,name,avatar_url']) ?? $review;
        });
    }

    public function recalculate(string $targetType, string $targetId): void
    {
        $stats = CustomerReview::query()
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->selectRaw('count(*) as total, coalesce(avg(rating), 0) as promedio')
            ->first();

        $total = (int) ($stats?->total ?? 0);
        $promedio = round((float) ($stats?->promedio ?? 0), 2);
        $score = $this->rankingScore($promedio, $total);

        $model = $this->resolveModel($targetType, $targetId);

        if ($model instanceof PubRestaurant) {
            $model->update([
                'rating_promedio' => $promedio,
                'total_resenas' => $total,
                'score_ranking' => $score + ($model->destacado ? 25 : 0) + min(20, (int) $model->total_reservas * 0.05),
            ]);

            return;
        }

        if ($model instanceof TourSpot) {
            $model->update([
                'rating_promedio' => $promedio,
                'total_resenas' => $total,
                'score_ranking' => $score + ($model->destacado ? 25 : 0),
            ]);
        }
    }

    public function rankingScore(float $rating, int $reviews): float
    {
        if ($reviews === 0) {
            return 0;
        }

        // Bayesian-ish: privilegia buen promedio con volumen de reseñas.
        return round(($rating * 20) + (log($reviews + 1) * 8), 4);
    }

    private function assertTargetExists(string $targetType, string $targetId): void
    {
        $exists = match ($targetType) {
            CustomerReview::TARGET_RESTAURANT => PubRestaurant::query()
                ->whereKey($targetId)
                ->where('activo', true)
                ->exists(),
            CustomerReview::TARGET_TOUR_SPOT => TourSpot::query()
                ->whereKey($targetId)
                ->where('estado', TourSpot::ESTADO_PUBLICADO)
                ->exists(),
            default => throw new InvalidArgumentException('Tipo de valoración no válido.'),
        };

        if (! $exists) {
            abort(404, 'El lugar a valorar no existe o no está publicado.');
        }
    }

    private function resolveModel(string $targetType, string $targetId): ?Model
    {
        return match ($targetType) {
            CustomerReview::TARGET_RESTAURANT => PubRestaurant::query()->find($targetId),
            CustomerReview::TARGET_TOUR_SPOT => TourSpot::query()->find($targetId),
            default => null,
        };
    }
}
