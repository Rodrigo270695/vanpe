<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\TourSpot;
use App\Services\Platform\TourSpotCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TourSpotController extends Controller
{
    public function __construct(
        private readonly TourSpotCatalogQuery $catalog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->catalog->list(
            $request->integer('departamento_id') ?: null,
            $request->string('category')->toString() ?: null,
            min($request->integer('per_page', 20), 50),
        );

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (TourSpot $spot): array => $this->catalog->toListItem($spot))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $spot = $this->catalog->findBySlug($slug);

        abort_if($spot === null, 404);

        return response()->json([
            'data' => $this->catalog->toDetail($spot),
        ]);
    }
}
