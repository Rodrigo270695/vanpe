<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TouristRouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $routes = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->with(['stops'])
            ->orderByRaw("case when status = 'draft' then 0 else 1 end")
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (TouristRoute $route): array => $this->serialize($route));

        return response()->json(['data' => $routes]);
    }

    public function current(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();
        $route = $this->draftFor($customer)->load('stops');

        return response()->json(['data' => $this->serialize($route)]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
        ]);

        // Archiva el borrador actual si existe y crea uno nuevo.
        TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->where('status', TouristRoute::STATUS_DRAFT)
            ->update(['status' => TouristRoute::STATUS_ARCHIVED]);

        $route = TouristRoute::query()->create([
            'customer_id' => $customer->id,
            'name' => $data['name'],
            'status' => TouristRoute::STATUS_DRAFT,
            'stops_count' => 0,
        ]);

        return response()->json(['data' => $this->serialize($route->load('stops'))], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $route = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'status' => ['sometimes', Rule::in([TouristRoute::STATUS_DRAFT, TouristRoute::STATUS_ARCHIVED])],
            'distance_meters' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'duration_seconds' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        if (($data['status'] ?? null) === TouristRoute::STATUS_DRAFT) {
            TouristRoute::query()
                ->where('customer_id', $customer->id)
                ->where('status', TouristRoute::STATUS_DRAFT)
                ->where('id', '!=', $route->id)
                ->update(['status' => TouristRoute::STATUS_ARCHIVED]);
        }

        $route->update($data);

        return response()->json(['data' => $this->serialize($route->fresh('stops'))]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $route = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $route->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function addStop(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'target_type' => ['required', Rule::in(['restaurant', 'tour_spot'])],
            'target_id' => ['required', 'uuid'],
            'slug' => ['nullable', 'string', 'max:180'],
            'nombre' => ['required', 'string', 'max:200'],
            'latitud' => ['required', 'numeric', 'between:-90,90'],
            'longitud' => ['required', 'numeric', 'between:-180,180'],
            'route_name' => ['nullable', 'string', 'max:160'],
        ]);

        $route = DB::transaction(function () use ($customer, $data): TouristRoute {
            $route = $this->draftFor($customer, $data['route_name'] ?? null);

            $exists = TouristRouteStop::query()
                ->where('tourist_route_id', $route->id)
                ->where('target_type', $data['target_type'])
                ->where('target_id', $data['target_id'])
                ->exists();

            if (! $exists) {
                $nextOrder = (int) TouristRouteStop::query()
                    ->where('tourist_route_id', $route->id)
                    ->max('sort_order') + 1;

                TouristRouteStop::query()->create([
                    'tourist_route_id' => $route->id,
                    'target_type' => $data['target_type'],
                    'target_id' => $data['target_id'],
                    'slug' => $data['slug'] ?? null,
                    'nombre' => $data['nombre'],
                    'latitud' => $data['latitud'],
                    'longitud' => $data['longitud'],
                    'sort_order' => $nextOrder,
                ]);

                $route->update([
                    'stops_count' => TouristRouteStop::query()
                        ->where('tourist_route_id', $route->id)
                        ->count(),
                ]);
            }

            return $route->fresh('stops');
        });

        return response()->json(['data' => $this->serialize($route)]);
    }

    public function removeStop(Request $request, string $stopId): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $stop = TouristRouteStop::query()
            ->whereKey($stopId)
            ->whereHas('route', fn ($q) => $q->where('customer_id', $customer->id))
            ->firstOrFail();

        $routeId = $stop->tourist_route_id;
        $stop->delete();

        $route = TouristRoute::query()->with('stops')->findOrFail($routeId);
        $route->update(['stops_count' => $route->stops->count()]);

        // Reindex sort_order
        $route->stops->values()->each(function (TouristRouteStop $row, int $index): void {
            $row->update(['sort_order' => $index + 1]);
        });

        return response()->json(['data' => $this->serialize($route->fresh('stops'))]);
    }

    public function reorderStops(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $route = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $data = $request->validate([
            'stop_ids' => ['required', 'array', 'min:1'],
            'stop_ids.*' => ['uuid'],
        ]);

        $stops = TouristRouteStop::query()
            ->where('tourist_route_id', $route->id)
            ->get()
            ->keyBy('id');

        if ($stops->count() !== count($data['stop_ids'])) {
            return response()->json(['message' => 'El orden no coincide con las paradas de la ruta.'], 422);
        }

        foreach ($data['stop_ids'] as $stopId) {
            if (! $stops->has($stopId)) {
                return response()->json(['message' => 'Parada inválida en el orden.'], 422);
            }
        }

        DB::transaction(function () use ($data): void {
            foreach ($data['stop_ids'] as $index => $stopId) {
                TouristRouteStop::query()
                    ->whereKey($stopId)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['data' => $this->serialize($route->fresh('stops'))]);
    }

    private function draftFor(Customer $customer, ?string $preferredName = null): TouristRoute
    {
        $draft = TouristRoute::query()
            ->where('customer_id', $customer->id)
            ->where('status', TouristRoute::STATUS_DRAFT)
            ->first();

        if ($draft !== null) {
            return $draft;
        }

        return TouristRoute::query()->create([
            'customer_id' => $customer->id,
            'name' => $preferredName ?: ('Ruta '.now()->timezone('America/Lima')->format('d/m/Y H:i')),
            'status' => TouristRoute::STATUS_DRAFT,
            'stops_count' => 0,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(TouristRoute $route): array
    {
        return [
            'id' => $route->id,
            'name' => $route->name,
            'status' => $route->status,
            'stops_count' => (int) $route->stops_count,
            'distance_meters' => $route->distance_meters,
            'duration_seconds' => $route->duration_seconds,
            'created_at' => $route->created_at?->toIso8601String(),
            'updated_at' => $route->updated_at?->toIso8601String(),
            'stops' => $route->relationLoaded('stops')
                ? $route->stops->map(fn (TouristRouteStop $stop): array => [
                    'id' => $stop->id,
                    'target_type' => $stop->target_type,
                    'target_id' => $stop->target_id,
                    'slug' => $stop->slug,
                    'nombre' => $stop->nombre,
                    'latitud' => (float) $stop->latitud,
                    'longitud' => (float) $stop->longitud,
                    'sort_order' => (int) $stop->sort_order,
                ])->values()->all()
                : [],
        ];
    }
}
