<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Craft;
use App\Services\Platform\CraftCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CraftController extends Controller
{
    public function __construct(
        private readonly CraftCatalogQuery $catalog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->catalog->list(
            $request->string('q')->toString() ?: null,
            min(max($request->integer('per_page', 12), 1), 50),
        );

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (Craft $craft): array => $this->catalog->toListItem($craft))
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
        $craft = $this->catalog->findBySlug($slug);

        abort_if($craft === null, 404);

        return response()->json([
            'data' => $this->catalog->toDetail($craft),
        ]);
    }
}
