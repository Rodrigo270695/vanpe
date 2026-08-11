<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ExtraordinaryEvent;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExtraordinaryEventController extends Controller
{
    /** Evento activo para el widget del home. */
    public function active(): JsonResponse
    {
        $event = ExtraordinaryEvent::query()
            ->activeNow()
            ->with('stops')
            ->orderBy('sort_order')
            ->orderByDesc('starts_at')
            ->first();

        if ($event === null) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => $this->serialize($event)]);
    }

    /**
     * Asigna el evento como ruta del turista (idempotente por evento).
     */
    public function claim(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $event = ExtraordinaryEvent::query()
            ->activeNow()
            ->with('stops')
            ->whereKey($id)
            ->firstOrFail();

        if ($event->stops->isEmpty()) {
            return response()->json(['message' => 'El evento aún no tiene paradas.'], 422);
        }

        // Idempotente: si ya reclamó este evento, devolver esa ruta (no duplicar).
        $existing = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->where('extraordinary_event_id', $event->id)
            ->whereIn('status', [
                TouristRoute::STATUS_DRAFT,
                TouristRoute::STATUS_COMPLETED,
                TouristRoute::STATUS_ARCHIVED,
            ])
            ->with('stops')
            ->orderByDesc('updated_at')
            ->first();

        if ($existing !== null) {
            if ($existing->status === TouristRoute::STATUS_DRAFT) {
                TouristRoute::query()
                    ->where('customer_id', $customer->id)
                    ->where('status', TouristRoute::STATUS_DRAFT)
                    ->where('id', '!=', $existing->id)
                    ->update(['status' => TouristRoute::STATUS_ARCHIVED]);
            }

            return response()->json([
                'data' => $this->serializeRoute($existing),
                'meta' => ['created' => false],
            ]);
        }

        $route = DB::transaction(function () use ($customer, $event): TouristRoute {
            TouristRoute::query()
                ->where('customer_id', $customer->id)
                ->where('status', TouristRoute::STATUS_DRAFT)
                ->update(['status' => TouristRoute::STATUS_ARCHIVED]);

            $route = TouristRoute::query()->create([
                'customer_id' => $customer->id,
                'extraordinary_event_id' => $event->id,
                'name' => $event->titulo,
                'status' => TouristRoute::STATUS_DRAFT,
                'stops_count' => 0,
            ]);

            foreach ($event->stops->values() as $index => $stop) {
                TouristRouteStop::query()->create([
                    'tourist_route_id' => $route->id,
                    'target_type' => $stop->target_type ?: 'tour_spot',
                    'target_id' => $stop->target_id ?: (string) Str::uuid(),
                    'slug' => $stop->slug,
                    'nombre' => $stop->nombre,
                    'latitud' => $stop->latitud,
                    'longitud' => $stop->longitud,
                    'sort_order' => $index + 1,
                ]);
            }

            $route->update(['stops_count' => $event->stops->count()]);

            return $route->fresh('stops');
        });

        return response()->json([
            'data' => $this->serializeRoute($route),
            'meta' => ['created' => true],
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ExtraordinaryEvent $event): array
    {
        return [
            'id' => $event->id,
            'titulo' => $event->titulo,
            'slug' => $event->slug,
            'cta_label' => $event->cta_label,
            'floating_text' => $event->floating_text ?: $event->cta_label,
            'descripcion' => $event->descripcion,
            'logo_url' => $event->logo_url,
            'year_effect' => $event->year_effect,
            'starts_at' => $event->starts_at?->toIso8601String(),
            'ends_at' => $event->ends_at?->toIso8601String(),
            'stops' => $event->stops->map(fn ($s): array => [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'slug' => $s->slug,
                'target_type' => $s->target_type,
                'target_id' => $s->target_id,
                'latitud' => $s->latitud,
                'longitud' => $s->longitud,
                'visita_at' => $s->visita_at?->toIso8601String(),
                'sort_order' => $s->sort_order,
            ])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRoute(TouristRoute $route): array
    {
        return [
            'id' => $route->id,
            'name' => $route->name,
            'status' => $route->status,
            'extraordinary_event_id' => $route->extraordinary_event_id,
            'stops_count' => $route->stops_count,
            'distance_meters' => $route->distance_meters,
            'duration_seconds' => $route->duration_seconds,
            'created_at' => $route->created_at?->toIso8601String(),
            'updated_at' => $route->updated_at?->toIso8601String(),
            'stops' => $route->stops->map(fn (TouristRouteStop $s): array => [
                'id' => $s->id,
                'target_type' => $s->target_type,
                'target_id' => $s->target_id,
                'slug' => $s->slug,
                'nombre' => $s->nombre,
                'latitud' => $s->latitud,
                'longitud' => $s->longitud,
                'sort_order' => $s->sort_order,
            ])->values(),
        ];
    }
}
