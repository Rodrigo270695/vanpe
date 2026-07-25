<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Services\Platform\TourEventCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TourEventController extends Controller
{
    public function __construct(
        private readonly TourEventCatalogQuery $events,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->events->paginate(
            $request->integer('departamento_id') ?: null,
            $request->string('q')->toString() ?: null,
            $request->integer('per_page') ?: 20,
        );

        return response()->json([
            'data' => collect($paginator->items())
                ->map(fn ($e) => $this->events->toListItem($e))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function featured(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 6), 1), 12);
        $rows = $this->events->featured($limit);

        return response()->json([
            'data' => collect($rows)
                ->map(fn ($e) => $this->events->toListItem($e))
                ->values(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $event = $this->events->findPublishedBySlug($slug);
        abort_if($event === null, 404, 'Evento no encontrado.');

        return response()->json([
            'data' => $this->events->toDetail($event),
        ]);
    }
}
