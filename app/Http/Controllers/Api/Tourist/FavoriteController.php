<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\AppFavorite;
use App\Models\Customer;
use App\Models\PubRestaurant;
use App\Models\TourSpot;
use App\Support\PublicMediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $favorites = AppFavorite::query()
            ->where('customer_id', $customer->id)
            ->latest()
            ->get();

        $restaurantIds = $favorites->where('target_type', AppFavorite::TARGET_RESTAURANT)->pluck('target_id');
        $spotIds = $favorites->where('target_type', AppFavorite::TARGET_TOUR_SPOT)->pluck('target_id');

        $restaurants = PubRestaurant::query()
            ->whereIn('id', $restaurantIds)
            ->where('activo', true)
            ->get()
            ->keyBy('id');

        $spots = TourSpot::query()
            ->whereIn('id', $spotIds)
            ->get()
            ->keyBy('id');

        $data = [];
        foreach ($favorites as $fav) {
            if ($fav->target_type === AppFavorite::TARGET_RESTAURANT) {
                $item = $restaurants->get($fav->target_id);
                if (! $item) {
                    continue;
                }
                $data[] = [
                    'id' => $fav->id,
                    'target_type' => $fav->target_type,
                    'target_id' => $fav->target_id,
                    'created_at' => $fav->created_at?->toIso8601String(),
                    'restaurant' => [
                        'id' => $item->id,
                        'slug' => $item->slug,
                        'nombre' => $item->nombre,
                        'direccion' => $item->direccion,
                        'portada_url' => PublicMediaUrl::make($item->portada_url),
                        'rating_promedio' => (float) $item->rating_promedio,
                        'tipo_cocina' => $item->tipo_cocina ?? [],
                    ],
                ];
            } else {
                $item = $spots->get($fav->target_id);
                if (! $item) {
                    continue;
                }
                $data[] = [
                    'id' => $fav->id,
                    'target_type' => $fav->target_type,
                    'target_id' => $fav->target_id,
                    'created_at' => $fav->created_at?->toIso8601String(),
                    'tour_spot' => [
                        'id' => $item->id,
                        'slug' => $item->slug,
                        'nombre' => $item->nombre,
                        'direccion' => $item->direccion,
                        'imagen_portada_url' => PublicMediaUrl::make($item->imagen_portada_url),
                        'rating_promedio' => (float) $item->rating_promedio,
                        'resumen' => $item->resumen,
                    ],
                ];
            }
        }

        return response()->json(['data' => $data]);
    }

    public function ids(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $keys = AppFavorite::query()
            ->where('customer_id', $customer->id)
            ->get(['target_type', 'target_id'])
            ->map(fn (AppFavorite $f): string => $f->target_type.':'.$f->target_id)
            ->values();

        return response()->json(['data' => $keys]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'target_type' => ['required', Rule::in([AppFavorite::TARGET_RESTAURANT, AppFavorite::TARGET_TOUR_SPOT])],
            'target_id' => ['required', 'uuid'],
        ]);

        $this->assertTargetExists($data['target_type'], $data['target_id']);

        $favorite = AppFavorite::query()->firstOrCreate([
            'customer_id' => $customer->id,
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
        ]);

        return response()->json([
            'data' => [
                'id' => $favorite->id,
                'target_type' => $favorite->target_type,
                'target_id' => $favorite->target_id,
            ],
            'message' => 'Añadido a favoritos.',
        ], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'target_type' => ['required', Rule::in([AppFavorite::TARGET_RESTAURANT, AppFavorite::TARGET_TOUR_SPOT])],
            'target_id' => ['required', 'uuid'],
        ]);

        AppFavorite::query()
            ->where('customer_id', $customer->id)
            ->where('target_type', $data['target_type'])
            ->where('target_id', $data['target_id'])
            ->delete();

        return response()->json(['data' => ['ok' => true], 'message' => 'Quitado de favoritos.']);
    }

    private function assertTargetExists(string $type, string $id): void
    {
        $exists = $type === AppFavorite::TARGET_RESTAURANT
            ? PubRestaurant::query()->whereKey($id)->where('activo', true)->exists()
            : TourSpot::query()->whereKey($id)->exists();

        abort_unless($exists, 422, 'El lugar no existe o no está disponible.');
    }
}
